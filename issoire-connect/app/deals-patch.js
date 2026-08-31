(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EUR=v=>Number(v||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const arr=(k)=>{if(!Array.isArray(S[k]))S[k]=[];return S[k]};
for(const k of ['myOrders','receivedOrders','paymentAccounts','orderItems','myProducts','myOffers'])arr(k);
const _loadPrivateDeals=loadPrivate;
const _offerCardDeals=typeof offerCard==='function'?offerCard:null;
const _productCardDeals=typeof productCard==='function'?productCard:null;
const _accountPageDeals=accountPage;
const _proAccountDeals=proAccount;

const businesses=()=>Array.isArray(S.businesses)?S.businesses:[];
const myBusinesses=()=>Array.isArray(S.myBusinesses)?S.myBusinesses:[];
const products=()=>Array.isArray(S.products)?S.products:[];
const offers=()=>Array.isArray(S.offers)?S.offers:[];
const business=x=>businesses().find(b=>b.id===x?.business_id);
const ownedIds=()=>new Set(myBusinesses().map(b=>b.id));
const activeOffer=o=>o?.is_active!==false&&(!o?.starts_at||new Date(o.starts_at)<=new Date())&&(!o?.ends_at||new Date(o.ends_at)>new Date());
const sourceButton=o=>o?.source_type==='external_public'&&o?.source_url?`<a class="btn" href="${E(o.source_url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">↗ Voir l’offre d’origine</a>`:'';
const priceText=o=>o?.price_label||((o?.sale_price!==null&&o?.sale_price!==undefined)?EUR(o.sale_price):'Voir conditions');
const productPrice=p=>p?.price_label||((p?.price!==null&&p?.price!==undefined)?EUR(p.price):'Sur devis');
const payReady=id=>{const p=arr('paymentAccounts').find(x=>x.business_id===id);return !!(p?.onboarding_complete&&p?.charges_enabled)};
const orderItems=id=>arr('orderItems').filter(x=>x.order_id===id);

function reserveButton(o){
 if(o?.source_type==='external_public'||!o?.reservation_enabled||!activeOffer(o))return '';
 return `<button class="btn brand" onclick="event.stopPropagation();openOfferReservation('${E(o.id)}')">${o.payment_required?'💳 Réserver et payer':'🛍 Réserver'}</button>`;
}
function dealMeta(o){
 const ext=o?.source_type==='external_public',b=business(o);
 return `<div class="notice" style="margin-top:8px"><b>${ext?'🌐 Offre publique externe':'✅ Offre du commerçant'}</b>${b?` · ${E(b.name)}`:''}<br><span class="muted">${E(priceText(o))}${Number.isFinite(Number(o?.quantity))?` · stock : ${Number(o.quantity)}`:''}${o?.ends_at?` · jusqu’au ${new Date(o.ends_at).toLocaleString('fr-FR')}`:''}${ext&&o?.source_name?` · source : ${E(o.source_name)}`:''}</span></div><div class="actions" style="margin-top:8px">${sourceButton(o)}${reserveButton(o)}</div>`;
}
if(_offerCardDeals){offerCard=function(o){let h=_offerCardDeals(o);if(!h.includes('Offre publique externe')&&!h.includes('Réserver et payer')&&!h.includes('🛍 Réserver'))h=h.replace('</article>',dealMeta(o)+'</article>');return h;};}

function orderProductButton(p){const b=business(p);if(!b?.reservations_enabled||p?.is_active===false)return '';return `<button class="btn brand" onclick="event.stopPropagation();openProductOrder('${E(p.id)}')">${p.price===null||p.price===undefined?'📝 Demander un devis':'🛒 Commander'}</button>`}
if(_productCardDeals){productCard=function(p){let h=_productCardDeals(p);if(!h.includes('openProductOrder(')){const b=business(p);h=h.replace('</article>',`<div class="notice" style="margin-top:8px"><b>${E(b?.name||'Commerce')}</b> · ${E(productPrice(p))}</div><div class="actions" style="margin-top:8px">${orderProductButton(p)}</div></article>`)}return h;};}

loadPrivate=async function(){
 await _loadPrivateDeals();
 if(!S.session){for(const k of ['myOrders','receivedOrders','paymentAccounts','orderItems','myProducts','myOffers'])S[k]=[];return}
 const uid=S.session.user.id,ids=[...ownedIds()];
 const mine=await sb.from('ic_orders').select('*').eq('buyer_id',uid).order('created_at',{ascending:false}).limit(100);
 S.myOrders=Array.isArray(mine.data)?mine.data:[];
 if(ids.length){
  const [received,pay,mp,mo]=await Promise.all([
   sb.from('ic_orders').select('*').in('business_id',ids).order('created_at',{ascending:false}).limit(200),
   sb.from('ic_business_payment_accounts').select('*').in('business_id',ids),
   sb.from('ic_products').select('*').in('business_id',ids).order('created_at',{ascending:false}),
   sb.from('ic_offers').select('*').in('business_id',ids).order('created_at',{ascending:false})
  ]);
  S.receivedOrders=Array.isArray(received.data)?received.data:[];S.paymentAccounts=Array.isArray(pay.data)?pay.data:[];S.myProducts=Array.isArray(mp.data)?mp.data:[];S.myOffers=Array.isArray(mo.data)?mo.data:[];
 }else{S.receivedOrders=[];S.paymentAccounts=[];S.myProducts=[];S.myOffers=[]}
 const orderIds=[...new Set([...arr('myOrders'),...arr('receivedOrders')].map(o=>o.id).filter(Boolean))];
 if(orderIds.length){const oi=await sb.from('ic_order_items').select('*').in('order_id',orderIds);S.orderItems=Array.isArray(oi.data)?oi.data:[]}else S.orderItems=[];
};

window.openOfferReservation=function(id){
 const o=offers().find(x=>x.id===id);if(!o)return say('Offre introuvable.');
 if(o.source_type==='external_public')return say('Cette offre provient d’une source externe. Utilisez le lien d’origine pour en profiter.');
 if(!S.session){say('Connectez-vous pour réserver cette offre.');authModal('offers');return}
 if(!o.reservation_enabled)return say('La réservation n’est pas activée pour cette offre.');
 const b=business(o),payment=o.payment_required;
 openModal(`<h2>${payment?'💳':'🛍'} Réserver — ${E(o.title)}</h2><p><b>${E(b?.name||'Commerce')}</b></p><div class="notice">Prix : <b>${E(priceText(o))}</b>${Number.isFinite(Number(o.quantity))?`<br>Stock annoncé : ${Number(o.quantity)}`:''}<br>${payment?'Le paiement sécurisé est effectué au commerce via Stripe.':'La réservation est envoyée au commerce sans paiement en ligne. Le règlement éventuel se fait directement avec le commerçant.'}</div><div class="form"><label>Quantité</label><input id="dealQty" type="number" min="1" max="50" value="1"><label>Note au commerce (facultatif)</label><textarea id="dealNote" maxlength="1000" rows="3"></textarea><button class="btn brand" id="dealSubmit" onclick="startOfferCheckout('${E(id)}')">${payment?'Continuer vers le paiement sécurisé':'Confirmer la réservation'}</button></div>`)
};

window.startOfferCheckout=async function(id){
 if(!S.session)return authModal('offers');
 const btn=$('#dealSubmit');if(btn){btn.disabled=true;btn.textContent='Traitement…'}
 const qty=Math.max(1,Math.min(50,Number($('#dealQty')?.value||1))),note=$('#dealNote')?.value.trim()||null;
 const {data,error}=await sb.rpc('ic_create_offer_reservation',{p_offer_id:id,p_quantity:qty,p_note:note});
 if(error){if(btn){btn.disabled=false;btn.textContent='Réessayer'}return say((error.message||'Réservation impossible').replaceAll('_',' '))}
 const row=Array.isArray(data)?data[0]:data;if(!row?.order_id)return say('Impossible de créer la réservation.');
 if(row.payment_status==='not_required'){
  closeModal();say('Réservation envoyée au commerce.');await loadPrivate();go('account');return;
 }
 try{
  const fnUrl='https://eazukvtjxeirbitukueb.supabase.co/functions/v1/ic-reservation-checkout';
  const r=await fetch(fnUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.session.access_token},body:JSON.stringify({order_id:row.order_id})});
  const out=await r.json().catch(()=>({}));
  if(!r.ok||!out.url)throw new Error(out.error||'Paiement sécurisé indisponible');
  location.href=out.url;
 }catch(e){await sb.rpc('ic_cancel_unpaid_reservation',{p_order_id:row.order_id}).catch(()=>{});say('La pré-réservation a été annulée : '+e.message);if(btn){btn.disabled=false;btn.textContent='Réessayer'}}
};

window.openProductOrder=function(id){
 const p=products().find(x=>x.id===id)||arr('myProducts').find(x=>x.id===id);if(!p)return say('Produit ou service introuvable.');
 if(!S.session){say('Connectez-vous pour commander ou demander un devis.');authModal('products');return}
 const b=business(p);if(!b?.reservations_enabled)return say('Ce commerce ne prend pas encore de commandes via Issoire Connect.');
 const quote=p.price===null||p.price===undefined;
 openModal(`<h2>${quote?'📝 Demande de devis':'🛒 Commander'} — ${E(p.name)}</h2><p><b>${E(b?.name||'Commerce')}</b></p><div class="notice">${quote?'Prix sur devis':`Prix unitaire : <b>${E(productPrice(p))}</b>`}<br>La demande est transmise directement au commerce. Aucun paiement en ligne n’est prélevé ici.</div><div class="form"><label>Quantité</label><input id="productQty" type="number" min="1" max="99" value="1"><label>Précisions (facultatif)</label><textarea id="productNote" maxlength="1000" rows="3"></textarea><button class="btn brand" id="productSubmit" onclick="submitProductOrder('${E(id)}')">Envoyer ${quote?'la demande de devis':'la commande'}</button></div>`)
};
window.submitProductOrder=async function(id){
 if(!S.session)return authModal('products');const btn=$('#productSubmit');if(btn){btn.disabled=true;btn.textContent='Envoi…'}
 const qty=Math.max(1,Math.min(99,Number($('#productQty')?.value||1))),note=$('#productNote')?.value.trim()||null;
 const {data,error}=await sb.rpc('ic_create_product_order',{p_product_id:id,p_quantity:qty,p_note:note});
 if(error){if(btn){btn.disabled=false;btn.textContent='Réessayer'}return say((error.message||'Commande impossible').replaceAll('_',' '))}
 closeModal();say('Votre demande a été envoyée au commerce.');await loadPrivate();go('account');return data;
};

const STATUS={pending:'En attente',accepted:'Acceptée',ready:'Prête',completed:'Terminée',cancelled:'Annulée'};
const PAYMENT={paid:'Payée',pending:'Paiement en attente',failed:'Paiement échoué/expiré',not_required:'Paiement au commerce',unpaid:'À régler'};
function orderSummary(o){const items=orderItems(o.id);return `${items.map(i=>`${E(i.label)} × ${Number(i.quantity||1)}`).join('<br>')||'Commande'}${o.note?`<div class="muted" style="margin-top:6px">Note : ${E(o.note)}</div>`:''}`}
function orderButtons(o,merchant=false){
 if(merchant){if(o.status==='pending')return `<button class="btn brand" onclick="setOrderStatus('${E(o.id)}','accepted')">Accepter</button><button class="btn" onclick="setOrderStatus('${E(o.id)}','cancelled')">Refuser</button>`;if(o.status==='accepted')return `<button class="btn brand" onclick="setOrderStatus('${E(o.id)}','ready')">Marquer prête</button><button class="btn" onclick="setOrderStatus('${E(o.id)}','cancelled')">Annuler</button>`;if(o.status==='ready')return `<button class="btn brand" onclick="setOrderStatus('${E(o.id)}','completed')">Terminer</button><button class="btn" onclick="setOrderStatus('${E(o.id)}','cancelled')">Annuler</button>`;return ''}
 return o.status==='pending'?`<button class="btn" onclick="setOrderStatus('${E(o.id)}','cancelled')">Annuler ma demande</button>`:'';
}
window.setOrderStatus=async function(id,status){const {error}=await sb.rpc('ic_set_order_status',{p_order_id:id,p_status:status});if(error)return say((error.message||'Action impossible').replaceAll('_',' '));say('Statut mis à jour.');await loadPrivate();if(ownedIds().has(arr('receivedOrders').find(o=>o.id===id)?.business_id))proAccount();else go('account')};
function orderCard(o,merchant=false){const b=business(o);return `<article class="card"><div class="row between"><span class="pill">${E(STATUS[o.status]||o.status)}</span><span class="pill">${E(PAYMENT[o.payment_status]||o.payment_status)}</span></div><h3>${o.total>0?EUR(o.total):'Montant à définir'}</h3><div>${orderSummary(o)}</div><div class="muted" style="margin-top:6px">${E(b?.name||'Commerce')} · ${new Date(o.created_at).toLocaleString('fr-FR')}</div>${o.reservation_expires_at&&o.status==='pending'?`<div class="muted">Réservation jusqu’au ${new Date(o.reservation_expires_at).toLocaleString('fr-FR')}</div>`:''}<div class="actions" style="margin-top:8px">${orderButtons(o,merchant)}</div></article>`}
function myOrdersSection(){return `<div class="sectionhead"><div><h2>🧾 Mes commandes & réservations</h2><p>Suivez ici vos demandes, commandes et réservations.</p></div><span class="pill">${arr('myOrders').length}</span></div>${arr('myOrders').length?`<div class="cards">${arr('myOrders').map(o=>orderCard(o,false)).join('')}</div>`:'<div class="empty">Aucune commande ou réservation pour le moment.</div>'}`}
function receivedOrdersSection(){return `<div class="sectionhead"><div><h2>📥 Commandes & réservations reçues</h2><p>Acceptez, préparez ou clôturez les demandes reçues.</p></div><span class="pill">${arr('receivedOrders').length}</span></div>${arr('receivedOrders').length?`<div class="cards">${arr('receivedOrders').map(o=>orderCard(o,true)).join('')}</div>`:'<div class="empty">Aucune demande reçue.</div>'}`}

window.setBusinessReservations=async function(id,enabled){const {data,error}=await sb.rpc('ic_set_business_reservations_enabled',{p_business_id:id,p_enabled:!!enabled});if(error)return say((error.message||'Action impossible').replaceAll('_',' '));const b=myBusinesses().find(x=>x.id===id);if(b)b.reservations_enabled=!!data;say(data?'Commandes et réservations activées.':'Commandes et réservations désactivées.');proAccount()};
function reservationControls(){if(!myBusinesses().length)return '';return `<div class="sectionhead"><div><h2>🛍 Commandes & réservations</h2><p>L’activation nécessite un forfait professionnel actif. Stripe n’est nécessaire que pour les offres avec paiement en ligne.</p></div></div>${myBusinesses().map(b=>`<article class="card" style="margin-bottom:10px"><h3>${E(b.name)}</h3><div class="muted">Forfait : ${E(b.plan||'free')} · Stripe : ${payReady(b.id)?'✅ prêt':'non configuré'} · Commandes/réservations : ${b.reservations_enabled?'activées':'désactivées'}</div><div class="actions" style="margin-top:8px"><button class="btn ${b.reservations_enabled?'':'brand'}" onclick="setBusinessReservations('${E(b.id)}',${!b.reservations_enabled})">${b.reservations_enabled?'Désactiver':'Activer'} les commandes/réservations</button></div></article>`).join('')}`}

window.openProductEditor=function(businessId,id=null){const b=myBusinesses().find(x=>x.id===businessId);if(!b)return say('Commerce introuvable.');const p=id?arr('myProducts').find(x=>x.id===id):null;if(id&&!p)return say('Produit introuvable.');openModal(`<h2>${p?'✏️ Modifier':'➕ Ajouter'} un produit/service</h2><div class="form"><label>Type</label><select id="prodKind"><option value="product" ${p?.kind!=='service'?'selected':''}>Produit</option><option value="service" ${p?.kind==='service'?'selected':''}>Service</option></select><label>Nom</label><input id="prodName" maxlength="120" value="${E(p?.name||'')}"><label>Description</label><textarea id="prodDesc" maxlength="1500" rows="3">${E(p?.description||'')}</textarea><div class="two"><div><label>Prix (€) — vide = sur devis</label><input id="prodPrice" type="number" min="0" step="0.01" value="${p?.price??''}"></div><div><label>Texte prix facultatif</label><input id="prodPriceLabel" maxlength="80" value="${E(p?.price_label||'')}"></div></div><label>Image (URL facultative)</label><input id="prodImage" type="url" value="${E(p?.image_url||'')}"><label><input id="prodActive" type="checkbox" ${p?.is_active===false?'':'checked'}> Visible dans le catalogue</label><button class="btn brand" onclick="saveProduct('${E(businessId)}',${id?`'${E(id)}'`:'null'})">💾 Enregistrer</button></div>`)};
window.saveProduct=async function(businessId,id=null){const b=myBusinesses().find(x=>x.id===businessId);if(!b)return say('Accès refusé.');const name=$('#prodName').value.trim();if(!name)return say('Le nom est obligatoire.');const raw=$('#prodPrice').value.trim(),price=raw===''?null:Number(raw);if(price!==null&&(!Number.isFinite(price)||price<0))return say('Prix invalide.');const payload={business_id:businessId,kind:$('#prodKind').value,name,description:$('#prodDesc').value.trim()||null,price,price_label:$('#prodPriceLabel').value.trim()||null,image_url:$('#prodImage').value.trim()||null,is_active:$('#prodActive').checked};const q=id?sb.from('ic_products').update(payload).eq('id',id).eq('business_id',businessId):sb.from('ic_products').insert(payload);const {error}=await q;if(error)return say(error.message);closeModal();say('Catalogue mis à jour.');await loadPrivate();proAccount()};
window.archiveProduct=async function(id){const p=arr('myProducts').find(x=>x.id===id);if(!p)return;const {error}=await sb.from('ic_products').update({is_active:false}).eq('id',id).eq('business_id',p.business_id);if(error)return say(error.message);await loadPrivate();proAccount()};

window.openOfferEditor=function(businessId,id=null){const b=myBusinesses().find(x=>x.id===businessId);if(!b)return say('Commerce introuvable.');const o=id?arr('myOffers').find(x=>x.id===id):null;if(id&&!o)return say('Offre introuvable.');const dt=v=>v?new Date(v).toISOString().slice(0,16):'';openModal(`<h2>${o?'✏️ Modifier':'⚡ Publier'} une offre</h2><div class="form"><label>Type</label><select id="offType"><option value="promotion" ${o?.offer_type==='promotion'?'selected':''}>Promotion</option><option value="invendu" ${o?.offer_type==='invendu'?'selected':''}>Invendu</option><option value="destockage" ${o?.offer_type==='destockage'?'selected':''}>Déstockage</option><option value="derniere_minute" ${o?.offer_type==='derniere_minute'?'selected':''}>Dernière minute</option></select><label>Titre</label><input id="offTitle" maxlength="140" value="${E(o?.title||'')}"><label>Description</label><textarea id="offDesc" maxlength="1500" rows="3">${E(o?.description||'')}</textarea><div class="two"><div><label>Prix initial (€)</label><input id="offOriginal" type="number" min="0" step="0.01" value="${o?.original_price??''}"></div><div><label>Prix offre (€)</label><input id="offSale" type="number" min="0" step="0.01" value="${o?.sale_price??''}"></div></div><div class="two"><div><label>Quantité / stock</label><input id="offQty" type="number" min="0" step="1" value="${o?.quantity??''}"></div><div><label>Texte prix facultatif</label><input id="offPriceLabel" maxlength="80" value="${E(o?.price_label||'')}"></div></div><div class="two"><div><label>Fin de l’offre</label><input id="offEnds" type="datetime-local" value="${dt(o?.ends_at)}"></div><div><label>Retrait avant</label><input id="offPickup" type="datetime-local" value="${dt(o?.pickup_deadline)}"></div></div><label><input id="offReserve" type="checkbox" ${o?.reservation_enabled?'checked':''}> Autoriser la réservation via Issoire Connect</label><label><input id="offPay" type="checkbox" ${o?.payment_required?'checked':''}> Exiger un paiement Stripe en ligne</label><label><input id="offActive" type="checkbox" ${o?.is_active===false?'':'checked'}> Offre visible</label><div class="notice">Sans paiement Stripe, l’habitant réserve et règle directement avec le commerce. Avec paiement Stripe, un compte de paiement vérifié est nécessaire.</div><button class="btn brand" onclick="saveOffer('${E(businessId)}',${id?`'${E(id)}'`:'null'})">💾 Enregistrer l’offre</button></div>`)};
window.saveOffer=async function(businessId,id=null){const b=myBusinesses().find(x=>x.id===businessId);if(!b)return say('Accès refusé.');const title=$('#offTitle').value.trim();if(!title)return say('Le titre est obligatoire.');const num=id=>{const v=$(id).value.trim();return v===''?null:Number(v)},original=num('#offOriginal'),sale=num('#offSale'),qty=num('#offQty'),reserve=$('#offReserve').checked,pay=$('#offPay').checked,type=$('#offType').value;if([original,sale,qty].some(v=>v!==null&&!Number.isFinite(v)))return say('Un nombre saisi est invalide.');if(reserve&&sale===null)return say('Un prix est nécessaire pour activer la réservation.');if(reserve&&['invendu','derniere_minute'].includes(type)&&(qty===null||qty<1))return say('Indiquez le stock disponible pour un invendu réservable.');if(reserve&&pay&&!payReady(businessId))return say('Le compte Stripe du commerce doit être configuré avant d’activer le paiement en ligne.');const toIso=id=>$(id).value?new Date($(id).value).toISOString():null;const payload={business_id:businessId,offer_type:type,title,description:$('#offDesc').value.trim()||null,original_price:original,sale_price:sale,quantity:qty===null?null:Math.max(0,Math.floor(qty)),price_label:$('#offPriceLabel').value.trim()||null,ends_at:toIso('#offEnds'),pickup_deadline:toIso('#offPickup'),is_active:$('#offActive').checked,source_type:'merchant',reservation_enabled:reserve,payment_required:pay};const q=id?sb.from('ic_offers').update(payload).eq('id',id).eq('business_id',businessId):sb.from('ic_offers').insert({...payload,starts_at:new Date().toISOString()});const {error}=await q;if(error)return say((error.message||'Impossible d’enregistrer').replaceAll('_',' '));closeModal();say('Offre publiée.');await loadPrivate();proAccount()};
window.archiveOffer=async function(id){const o=arr('myOffers').find(x=>x.id===id);if(!o)return;const {error}=await sb.from('ic_offers').update({is_active:false}).eq('id',id).eq('business_id',o.business_id);if(error)return say(error.message);await loadPrivate();proAccount()};

function catalogManagement(){if(!myBusinesses().length)return '';return myBusinesses().map(b=>{const ps=arr('myProducts').filter(x=>x.business_id===b.id),os=arr('myOffers').filter(x=>x.business_id===b.id);return `<div class="sectionhead"><div><h2>🛍 Catalogue — ${E(b.name)}</h2><p>Produits, services, promotions, invendus et dernière minute.</p></div><div class="actions"><button class="btn brand" onclick="openProductEditor('${E(b.id)}')">➕ Produit/service</button><button class="btn brand" onclick="openOfferEditor('${E(b.id)}')">⚡ Offre/invendu</button></div></div><h3>Produits & services</h3>${ps.length?`<div class="cards">${ps.map(p=>`<article class="card"><span class="pill">${p.is_active?'Visible':'Masqué'}</span><h3>${E(p.name)}</h3><div>${E(productPrice(p))}</div><div class="actions" style="margin-top:8px"><button class="btn" onclick="openProductEditor('${E(b.id)}','${E(p.id)}')">Modifier</button>${p.is_active?`<button class="btn" onclick="archiveProduct('${E(p.id)}')">Masquer</button>`:''}</div></article>`).join('')}</div>`:'<div class="empty">Aucun produit ou service.</div>'}<h3 style="margin-top:16px">Offres & invendus</h3>${os.length?`<div class="cards">${os.map(o=>`<article class="card"><span class="pill">${o.is_active?'Visible':'Masquée'}</span><h3>${E(o.title)}</h3><div>${E(priceText(o))}${o.quantity!==null&&o.quantity!==undefined?` · stock ${Number(o.quantity)}`:''}</div><div class="muted">${E(o.offer_type)} · ${o.reservation_enabled?'réservable':'sans réservation'}${o.payment_required?' · paiement en ligne':''}</div><div class="actions" style="margin-top:8px"><button class="btn" onclick="openOfferEditor('${E(b.id)}','${E(o.id)}')">Modifier</button>${o.is_active?`<button class="btn" onclick="archiveOffer('${E(o.id)}')">Masquer</button>`:''}</div></article>`).join('')}</div>`:'<div class="empty">Aucune offre publiée.</div>'}`}).join('')}

accountPage=function(){const out=_accountPageDeals();if(S.session&&S.profile?.role!=='admin'){try{main.insertAdjacentHTML('beforeend',myOrdersSection())}catch(e){console.error('orders account render',e)}}return out};
proAccount=function(){const out=_proAccountDeals();if(S.session){try{main.insertAdjacentHTML('beforeend',reservationControls()+catalogManagement()+receivedOrdersSection())}catch(e){console.error('commerce management render',e)}}return out};
})();
