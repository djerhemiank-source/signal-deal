(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const V='50.0';
const P={handling:false,handled:false};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUS={pending:'En attente',accepted:'Acceptée',ready:'Prête',completed:'Terminée',cancelled:'Annulée'};
const statusLabel=v=>window.icV48?.statusLabel?.(v)||STATUS[v]||v||'—';
// Push deep link attendu : ?notification=order&id=<order_uuid>&notification_id=<notification_uuid>

function friendlyOrderError(err){
 const m=String(err?.message||err||'');
 if(m.includes('AUTH_REQUIRED'))return 'Connectez-vous pour modifier cette transaction.';
 if(m.includes('ORDER_NOT_FOUND'))return 'Transaction introuvable.';
 if(m.includes('INVALID_STATUS'))return 'Statut de transaction invalide.';
 if(m.includes('STATUS_TRANSITION_FORBIDDEN'))return 'Cette étape n’est pas autorisée depuis le statut actuel.';
 return m||'Impossible de mettre à jour la transaction.';
}

async function sendOrderPush(notificationId){
 if(!notificationId||!UUID.test(String(notificationId)))return {skipped:true};
 try{
   const {data,error}=await sb.functions.invoke('ic-send-order-notification-push',{body:{notification_id:notificationId}});
   if(error)return {error};
   return data||{};
 }catch(error){return {error}}
}

window.setOrder=async function(id,status){
 if(!S.session)return typeof authModal==='function'?authModal('account'):null;
 if(status==='cancelled'&&!confirm('Annuler cette commande ou réservation ?'))return;
 const {data:notificationId,error}=await sb.rpc('ic_set_order_status_v50',{p_order_id:id,p_status:status});
 if(error)return typeof say==='function'?say(friendlyOrderError(error)):null;

 // Le Push est un canal supplémentaire : son échec ne doit jamais annuler la transition métier déjà validée.
 if(notificationId)sendOrderPush(notificationId).then(result=>{
   if(result?.error)console.warn('Issoire Connect V50 push non envoyé',result.error);
 }).catch(()=>{});

 if(typeof say==='function')say(`Statut : ${statusLabel(status)}.`);
 if(typeof loadPrivate==='function')await loadPrivate();
 try{await window.icV48?.loadExperience?.(true)}catch{}
 if(typeof render==='function')render();
 setTimeout(()=>{if(S.page==='account')window.icV48?.renderAccountExperience?.()},180);
};

function deepLink(){
 try{
   const q=new URLSearchParams(location.search);
   const type=q.get('notification'),orderId=q.get('id'),notificationId=q.get('notification_id');
   if(type!=='order'||!UUID.test(String(orderId||'')))return null;
   return {orderId,notificationId:UUID.test(String(notificationId||''))?notificationId:null};
 }catch{return null}
}
function clearDeepLink(){
 try{
   const u=new URL(location.href);
   u.searchParams.delete('notification');u.searchParams.delete('id');u.searchParams.delete('notification_id');
   history.replaceState(history.state,'',u.pathname+(u.searchParams.toString()?`?${u.searchParams}`:'')+u.hash);
 }catch{}
}
async function markDeepLinkRead(notificationId){
 if(!notificationId||!S.session)return;
 try{
   await sb.from('ic_notifications').update({read_at:new Date().toISOString()})
     .eq('id',notificationId).eq('user_id',S.session.user.id);
   await window.icV49?.refreshBadge?.();
 }catch{}
}
async function handleOrderDeepLink(){
 const link=deepLink();
 if(!link||P.handled||P.handling)return false;
 if(!S.session)return false;
 P.handling=true;
 try{
   await markDeepLinkRead(link.notificationId);
   if(typeof closeModal==='function')closeModal();
   let ok=false;
   if(window.icV48?.focusOrder)ok=await window.icV48.focusOrder(link.orderId);
   else if(typeof go==='function')go('account');
   clearDeepLink();P.handled=true;
   if(typeof say==='function')say(ok?'Transaction ouverte depuis votre notification.':'Transaction mise à jour. Retrouvez-la dans votre compte.');
   return ok;
 }finally{P.handling=false}
}

const baseLoadPrivate=window.loadPrivate;
if(typeof baseLoadPrivate==='function')window.loadPrivate=async function(...args){
 const result=await baseLoadPrivate.apply(this,args);
 setTimeout(handleOrderDeepLink,120);
 return result;
};

let tries=0;
const boot=setInterval(()=>{
 tries++;
 if(P.handled||!deepLink()||tries>40){clearInterval(boot);return}
 if(S.session)handleOrderDeepLink();
},250);

window.icV50={version:V,sendOrderPush,handleOrderDeepLink,deepLink};
})();
