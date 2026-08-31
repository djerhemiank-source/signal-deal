(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const EUR=v=>Number(v||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
S.myOrders=S.myOrders||[];S.receivedOrders=S.receivedOrders||[];S.paymentAccounts=S.paymentAccounts||[];
const _loadPrivateDeals=loadPrivate;
const _offerCardDeals=typeof offerCard==='function'?offerCard:null;
const _accountPageDeals=accountPage;
const _proAccountDeals=proAccount;

const activeOffer=o=>o?.is_active!==false&&(!o?.starts_at||new Date(o.starts_at)<=new Date())&&(!o?.ends_at||new Date(o.ends_at)>=new Date());
const business=o=>(S.businesses||[]).find(b=>b.id===o.business_id);
const ownedIds=()=>new Set((S.myBusinesses||[]).map(b=>b.id));
const sourceButton=o=>o?.source_type==='external_public'&&o?.source_url?`<a class="btn" href="${E(o.source_url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">↗ Voir l’offre d’origine</a>`:'';
const priceText=o=>o?.price_label||((o?.sale_price!==null&&o?.sale_price!==undefined)?EUR(o.sale_price):'Voir conditions');
function reserveButton(o){
 if(o?.source_type==='external_public')return '';
 if(!o?.reservation_enabled||!activeOffer(o))return '';
 return `<button class="btn brand" onclick="event.stopPropagation();openOfferReservation('${E(o.id)}')">💳 Réserver et payer</button>`;
}
function dealMeta(o){
 const ext=o?.source_type==='external_public';
 const b=business(o);
 return `<div class="notice" style="margin-top:8px"><b>${ext?'🌐 Offre publique externe':'✅ Offre du commerçant'}</b>${b?` · ${E(b.name)}`:''}<br><span class="muted">${E(priceText(o))}${o?.ends_at?` · jusqu’au ${new Date(o.ends_at).toLocaleString('fr-FR')}`:''}${ext&&o?.source_name?` · source : ${E(o.source_name)}`:''}</span></div><div class="actions" style="margin-top:8px">${sourceButton(o)}${reserveButton(o)}</div>`;
}
if(_offerCardDeals){offerCard=function(o){let h=_offerCardDeals(o);if(!h.includes('Offre publique externe')&&!h.includes('Réserver et payer'))h=h.replace('</article>',dealMeta(o)+'</article>');return h;};}

loadPrivate=async function(){
 await _loadPrivateDeals();
 if(!S.session){S.myOrders=[];S.receivedOrders=[];S.paymentAccounts=[];return}
 const uid=S.session.user.id,ids=[...(ownedIds())];
 const mine=await sb.from('ic_orders').select('*').eq('buyer_id',uid).order('created_at',{ascending:false}).limit(100);
 S.myOrders=mine.data||[];
 if(ids.length){
  const [received,pay]=await Promise.all([
   sb.from('ic_orders').select('*').in('business_id',ids).order('created_at',{ascending:false}).limit(200),
   sb.from('ic_business_payment_accounts').select('*').in('business_id',ids)
  ]);
  S.receivedOrders=received.data||[];S.paymentAccounts=pay.data||[];
 }else{S.receivedOrders=[];S.paymentAccounts=[]}
};

window.openOfferReservation=function(id){
 const o=(S.offers||[]).find(x=>x.id===id);if(!o)return say('Offre introuvable.');
 if(o.source_type==='external_public')return say('Cette offre provient d’une source externe. Utilisez le lien d’origine pour en profiter.');
 if(!S.session){say('Connectez-vous pour réserver cette offre.');authModal('offers');return}
 if(!o.reservation_enabled)return say('La réservation en ligne n’est pas activée pour cette offre.');
 const b=business(o);
 openModal(`<h2>💳 Réserver — ${E(o.title)}</h2><p><b>${E(b?.name||'Commerce')}</b></p><div class="notice">Prix : <b>${E(priceText(o))}</b><br>Le paiement est effectué au commerce. La pré-réservation est conservée 30 minutes pendant le paiement.</div><div class="form"><label>Quantité</label><input id="dealQty" type="number" min="1" max="50" value="1"><label>Note au commerce (facultatif)</label><textarea id="dealNote" maxlength="1000" rows="3"></textarea><button class="btn brand" onclick="startOfferCheckout('${E(id)}')">Continuer vers le paiement sécurisé</button></div>`)
};

window.startOfferCheckout=async function(id){
 if(!S.session)return authModal('offers');
 const qty=Math.max(1,Math.min(50,Number($('#dealQty')?.value||1))),note=$('#dealNote')?.value.trim()||null;
 const {data,error}=await sb.rpc('ic_create_offer_reservation',{p_offer_id:id,p_quantity:qty,p_note:note});
 if(error)return say((error.message||'Réservation impossible').replaceAll('_',' '));
 const row=Array.isArray(data)?data[0]:data;if(!row?.order_id)return say('Impossible de créer la pré-réservation.');
 try{
  const fnUrl='https://eazukvtjxeirbitukueb.supabase.co/functions/v1/ic-reservation-checkout';
  const r=await fetch(fnUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.session.access_token},body:JSON.stringify({order_id:row.order_id})});
  const out=await r.json().catch(()=>({}));
  if(!r.ok||!out.url)throw new Error(out.error||'Paiement test pas encore configuré');
  location.href=out.url;
 }catch(e){await sb.rpc('ic_cancel_unpaid_reservation',{p_order_id:row.order_id}).catch(()=>{});say('La pré-réservation a été annulée : '+e.message)}
};

const orderStatus=o=>o.payment_status==='paid'?'✅ Payée':o.status==='cancelled'?'❌ Annulée':o.payment_status==='pending'?'⏳ Paiement en attente':o.payment_status==='failed'?'⌛ Expirée':'🧾 En cours';
function myOrdersSection(){return `<div class="sectionhead"><div><h2>🧾 Mes réservations</h2><p>Réservations et paiements effectués via Issoire Connect.</p></div><span class="pill">${S.myOrders.length}</span></div>${S.myOrders.length?`<div class="cards">${S.myOrders.map(o=>`<article class="card"><span class="pill">${orderStatus(o)}</span><h3>${EUR(o.total)}</h3><div class="muted">${new Date(o.created_at).toLocaleString('fr-FR')}</div>${o.reservation_expires_at&&o.payment_status==='pending'?`<p class="muted">Pré-réservation jusqu’au ${new Date(o.reservation_expires_at).toLocaleTimeString('fr-FR')}</p>`:''}</article>`).join('')}</div>`:'<div class="empty">Aucune réservation pour le moment.</div>'}`}
function receivedOrdersSection(){return `<div class="sectionhead"><div><h2>📥 Réservations reçues</h2><p>Réservations effectuées auprès de vos établissements.</p></div><span class="pill">${S.receivedOrders.length}</span></div>${S.receivedOrders.length?`<div class="cards">${S.receivedOrders.map(o=>`<article class="card"><span class="pill">${orderStatus(o)}</span><h3>${EUR(o.total)}</h3><div class="muted">${new Date(o.created_at).toLocaleString('fr-FR')}</div></article>`).join('')}</div>`:'<div class="empty">Aucune réservation reçue.</div>'}`}

window.setBusinessReservations=async function(id,enabled){const {data,error}=await sb.rpc('ic_set_business_reservations_enabled',{p_business_id:id,p_enabled:!!enabled});if(error)return say((error.message||'Action impossible').replaceAll('_',' '));const b=(S.myBusinesses||[]).find(x=>x.id===id);if(b)b.reservations_enabled=!!data;say(data?'Réservations activées.':'Réservations désactivées.');go('account')};
function paymentAccountFor(id){return S.paymentAccounts.find(x=>x.business_id===id)}
function reservationControls(){const rows=S.myBusinesses||[];if(!rows.length)return '';return `<div class="sectionhead"><div><h2>💳 Bons plans & réservations payantes</h2><p>La réservation directe nécessite un forfait professionnel actif et un compte de paiement Stripe vérifié.</p></div></div>${rows.map(b=>{const p=paymentAccountFor(b.id),ready=!!(p?.onboarding_complete&&p?.charges_enabled);return `<article class="card" style="margin-bottom:10px"><h3>${E(b.name)}</h3><div class="muted">Paiements Stripe : ${ready?'✅ prêts':'⏳ à configurer'} · Réservations : ${b.reservations_enabled?'activées':'désactivées'}</div><div class="actions" style="margin-top:8px"><button class="btn ${b.reservations_enabled?'':'brand'}" onclick="setBusinessReservations('${E(b.id)}',${!b.reservations_enabled})">${b.reservations_enabled?'Désactiver':'Activer'} les réservations</button></div></article>`}).join('')}`}

accountPage=function(){const out=_accountPageDeals();if(S.session&&S.profile?.role!=='admin'){try{main.insertAdjacentHTML('beforeend',myOrdersSection())}catch(e){console.error(e)}}return out};
proAccount=function(){const out=_proAccountDeals();if(S.session){try{main.insertAdjacentHTML('beforeend',reservationControls()+receivedOrdersSection())}catch(e){console.error(e)}}return out};
})();
