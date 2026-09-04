(function(){
  'use strict';
  function vapidBytes(base64){
    const pad='='.repeat((4-base64.length%4)%4),raw=atob((base64+pad).replace(/-/g,'+').replace(/_/g,'/'));
    return Uint8Array.from(raw,c=>c.charCodeAt(0));
  }
  window.enableNotificationsV59=async function(){
    if(!sb||!S.session)return say('Connectez-vous d’abord');
    if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window))return say('Web Push indisponible sur ce navigateur');
    try{
      const permission=await Notification.requestPermission();
      if(permission!=='granted')return say('Notifications non autorisées');
      const {data:key,error:keyErr}=await sb.rpc('ic_webpush_public_key');
      if(keyErr)throw keyErr;if(!key)throw new Error('Clé Web Push indisponible');
      const reg=await navigator.serviceWorker.ready;
      let sub=await reg.pushManager.getSubscription();
      if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidBytes(String(key))});
      const j=sub.toJSON(),keys=j.keys||{};
      if(!sub.endpoint||!keys.p256dh||!keys.auth)throw new Error('Abonnement Push incomplet');
      const {error:saveErr}=await sb.rpc('ic_upsert_push_subscription',{p_endpoint:sub.endpoint,p_p256dh:keys.p256dh,p_auth_key:keys.auth,p_user_agent:navigator.userAgent||null});
      if(saveErr)throw saveErr;
      if(typeof refreshV59State==='function')await refreshV59State();
      else say('Notifications activées sur cet appareil');
    }catch(e){say('Activation des notifications impossible : '+(e?.message||e))}
  };
})();
