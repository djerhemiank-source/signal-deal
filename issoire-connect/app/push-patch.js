(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const _accountPagePush=accountPage;
const pushEndpoint='https://eazukvtjxeirbitukueb.supabase.co/functions/v1/ic-send-business-alert-push';
S.pushState=S.pushState||{supported:false,permission:'default',subscribed:false};
const uid=()=>S.session?.user?.id||null;
function supported(){return 'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window}
function b64ToBytes(v){const pad='='.repeat((4-v.length%4)%4),s=(v+pad).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(s),a=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return a}
async function reg(){if(!supported())throw new Error('push_not_supported');return await navigator.serviceWorker.ready}
async function syncPushState(){S.pushState.supported=supported();S.pushState.permission=supported()?Notification.permission:'unsupported';S.pushState.subscribed=false;if(!supported())return S.pushState;try{const r=await reg(),sub=await r.pushManager.getSubscription();S.pushState.subscribed=!!sub}catch{}document.querySelectorAll('[data-ic-push-status]').forEach(x=>x.textContent=pushStatusText());return S.pushState}
window.refreshPushStatus=syncPushState;
function pushStatusText(){if(!S.pushState.supported)return 'Notifications système non prises en charge sur ce navigateur.';if(S.pushState.permission==='denied')return 'Notifications bloquées dans les réglages du navigateur.';if(S.pushState.subscribed)return '✅ Notifications téléphone/PC activées pour ce compte.';return 'Notifications système non activées.'}
window.enablePushNotifications=async function(){
 if(!S.session){say('Connectez-vous pour activer les notifications.');authModal('account');return}
 if(!supported())return say('Ce navigateur ne prend pas en charge les notifications Push.');
 let permission=Notification.permission;if(permission==='default')permission=await Notification.requestPermission();if(permission!=='granted'){await syncPushState();return say('Autorisation de notification non accordée.')}
 try{
  const {data:key,error:keyError}=await sb.rpc('ic_webpush_public_key');if(keyError||!key)throw new Error('Clé Web Push indisponible.');
  const r=await reg();let sub=await r.pushManager.getSubscription();if(!sub)sub=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToBytes(key)});
  const j=sub.toJSON(),p256dh=j.keys?.p256dh,authKey=j.keys?.auth;if(!p256dh||!authKey)throw new Error('Abonnement Push incomplet.');
  const {error}=await sb.rpc('ic_upsert_push_subscription',{p_endpoint:sub.endpoint,p_p256dh:p256dh,p_auth_key:authKey,p_user_agent:navigator.userAgent});if(error)throw error;
  await syncPushState();say('Notifications téléphone/PC activées.');accountPage();
 }catch(e){console.error('Issoire Connect push enable',e);say(String(e?.message||e).replaceAll('_',' '))}
};
window.disablePushNotifications=async function(){
 if(!S.session)return authModal('account');if(!supported())return;
 try{const r=await reg(),sub=await r.pushManager.getSubscription();if(sub){await sb.rpc('ic_disable_push_subscription',{p_endpoint:sub.endpoint});await sub.unsubscribe()}await syncPushState();say('Notifications téléphone/PC désactivées.');accountPage()}catch(e){say(String(e?.message||e).replaceAll('_',' '))}
};
window.dispatchBusinessAlertPush=async function(alertId){
 if(!S.session||!alertId)return {sent:0,failed:0};
 try{const r=await fetch(pushEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.session.access_token},body:JSON.stringify({alert_id:alertId})});const out=await r.json().catch(()=>({}));if(!r.ok)throw new Error(out.error||'push_dispatch_failed');return out}catch(e){console.warn('Issoire Connect push dispatch',e);return {sent:0,failed:0,error:String(e?.message||e)}}
};
function proBusiness(id){return (S.myBusinesses||[]).find(b=>b.id===id&&b.owner_id===uid())}
function alertError(e){const m=String(e?.message||e||'Action impossible');if(/Aucun abonné/i.test(m))return 'Aucun de vos abonnés n’a activé ce type de notification pour ce commerce.';return m.replaceAll('_',' ')}
window.sendBusinessAlert=async function(id){
 const b=proBusiness(id);if(!b)return say('Accès refusé.');
 const type=$('#paType')?.value,title=$('#paTitle')?.value.trim()||'',body=$('#paBody')?.value.trim()||'';if(title.length<3)return say('Ajoutez un titre plus précis.');if(body.length<3)return say('Ajoutez un message.');
 const [linkType,linkId]=String($('#paLink')?.value||`business:${id}`).split(':');const btn=$('#paSend');if(btn){btn.disabled=true;btn.textContent='Envoi…'}
 const {data,error}=await sb.rpc('ic_send_business_alert',{p_business_id:id,p_alert_type:type,p_title:title,p_body:body,p_link_type:linkType,p_link_id:linkId||null});
 if(error){if(btn){btn.disabled=false;btn.textContent='📣 Envoyer l’alerte'}return say(alertError(error))}
 const out=Array.isArray(data)?data[0]:data;const push=await window.dispatchBusinessAlertPush(out?.alert_id);closeModal();
 const devices=Number(push?.sent||0);say(`Alerte envoyée à ${out?.recipient_count||0} abonné${(out?.recipient_count||0)>1?'s':''}.${devices?` ${devices} appareil${devices>1?'s':''} notifié${devices>1?'s':''} par Push.`:' La notification reste disponible dans Issoire Connect.'}`);
 if(typeof window.refreshProToolStats==='function')await window.refreshProToolStats(id);proAccount();
};
function pushSection(){if(!S.session)return '';return `<div class="sectionhead"><div><h2>🔔 Notifications téléphone / PC</h2><p>Recevez les alertes des commerces que vous suivez même lorsque Issoire Connect n’est pas au premier plan.</p></div></div><article class="card"><div class="muted" data-ic-push-status>${E(pushStatusText())}</div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="enablePushNotifications()">🔔 Activer</button><button class="btn" onclick="disablePushNotifications()">Désactiver</button><button class="btn" onclick="refreshPushStatus()">↻ Vérifier</button></div><p class="muted">Le navigateur demande votre autorisation. Vous pouvez la retirer à tout moment.</p></article>`}
accountPage=function(){const out=_accountPagePush();if(S.session){try{main.insertAdjacentHTML('beforeend',pushSection());setTimeout(syncPushState,0)}catch(e){console.error('Issoire Connect push account',e)}}return out};
async function handlePushLink(){const p=new URLSearchParams(location.search),type=p.get('notification'),id=p.get('id');if(!type||!id)return;for(let i=0;i<20;i++){if(typeof go==='function'&&Array.isArray(S.businesses)){if(type==='business'&&typeof viewBusiness==='function')viewBusiness(id);else if(type==='offer')go('deals');else if(type==='job')go('jobs');else if(type==='event')go('events');p.delete('notification');p.delete('id');const qs=p.toString();history.replaceState({},'',location.pathname+(qs?'?'+qs:'')+location.hash);return}await new Promise(r=>setTimeout(r,400))}}
setTimeout(handlePushLink,500);
})();
