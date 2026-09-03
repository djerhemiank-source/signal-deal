(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const V='49.0';
const N={rows:[],loading:null,channel:null,user:null};
const e49=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const dt49=v=>{try{return v?new Date(v).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}):'—'}catch{return'—'}};

async function loadNotifications(force=false){
 if(!S.session){N.rows=[];return N.rows}
 if(N.loading&&!force)return N.loading;
 N.loading=(async()=>{
   const {data,error}=await sb.from('ic_notifications')
     .select('id,title,body,link_type,link_id,read_at,created_at,business_alert_id')
     .eq('user_id',S.session.user.id)
     .order('created_at',{ascending:false})
     .limit(100);
   if(error)throw error;
   N.rows=data||[];return N.rows;
 })();
 try{return await N.loading}finally{N.loading=null}
}

function unreadCount(){return N.rows.reduce((n,r)=>n+(r.read_at?0:1),0)}
function bellButton(){
 return [...document.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').replace(/\s/g,'').includes('openNotifications()'))||null;
}
function ensureBellBadge(){
 const bell=bellButton();if(!bell)return;
 bell.style.position='relative';bell.title='Centre de notifications';
 let badge=document.getElementById('ic49NotificationBadge');
 if(!badge){badge=document.createElement('span');badge.id='ic49NotificationBadge';badge.style.cssText='position:absolute;right:-4px;top:-5px;min-width:19px;height:19px;padding:0 4px;border-radius:999px;background:#f47721;color:#fff;font-size:11px;font-weight:900;display:grid;place-items:center;border:2px solid #fff';bell.appendChild(badge)}
 const n=unreadCount();badge.textContent=n>99?'99+':String(n);badge.style.display=n?'grid':'none';
}
async function refreshBadge(){
 if(!S.session){N.rows=[];ensureBellBadge();return 0}
 try{await loadNotifications(true);ensureBellBadge();return unreadCount()}catch{return 0}
}

function iconForNotification(r){
 if(r.link_type==='order')return '🧾';
 if(r.link_type==='business')return '🏪';
 if(r.link_type==='offer')return '🔥';
 return '🔔';
}
function actionLabel(r){
 if(r.link_type==='order')return 'Voir la transaction';
 if(r.link_type==='business')return 'Voir l’entreprise';
 if(r.link_type==='offer')return 'Voir les bons plans';
 return 'Ouvrir';
}
function notificationCard(r){
 return `<article class="card" style="margin:9px 0;${r.read_at?'':'border-left:4px solid #f47721'}"><div class="row between" style="gap:10px;align-items:flex-start"><div><span class="pill">${iconForNotification(r)} ${r.read_at?'LUE':'NOUVELLE'}</span><h3 style="margin:7px 0 3px">${e49(r.title||'Notification Issoire Connect')}</h3><div>${e49(r.body||'')}</div><div class="muted" style="margin-top:6px">${e49(dt49(r.created_at))}</div></div>${r.read_at?'':'<span class="pill">●</span>'}</div><div class="actions"><button class="btn brand" onclick="openIc49Notification('${e49(r.id)}')">${e49(actionLabel(r))}</button>${r.read_at?'':`<button class="btn" onclick="markIc49NotificationRead('${e49(r.id)}')">✓ Marquer comme lue</button>`}</div></article>`;
}

window.openNotifications=async function(){
 if(!S.session)return typeof authModal==='function'?authModal('account'):null;
 openModal('<h2>🔔 Centre de notifications</h2><div id="ic49NotificationList" class="empty">Chargement…</div>');
 try{
   await loadNotifications(true);ensureBellBadge();
   const host=document.getElementById('ic49NotificationList');if(!host)return;
   const n=unreadCount();
   host.className='';host.innerHTML=`<div class="row between" style="gap:10px;align-items:flex-start"><div><span class="pill">${n?`${n} NON LUE(S)`:'À JOUR'}</span><p class="muted" style="margin:7px 0">Commandes, réservations, activité locale et alertes de votre compte.</p></div><div class="actions" style="margin-top:0">${n?'<button class="btn" onclick="markAllIc49NotificationsRead()">✓ Tout marquer comme lu</button>':''}${typeof window.enableIcPush==='function'?'<button class="btn" onclick="closeModal();go(\'account\')">📲 Réglages Push</button>':''}</div></div>${N.rows.length?N.rows.map(notificationCard).join(''):'<div class="empty">Aucune notification pour le moment.</div>'}`;
 }catch(err){const host=document.getElementById('ic49NotificationList');if(host)host.innerHTML=`<div class="notice"><b>Impossible de charger vos notifications.</b><br>${e49(err?.message||err)}</div>`}
};

window.markIc49NotificationRead=async function(id){
 if(!S.session)return;
 const {error}=await sb.from('ic_notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('user_id',S.session.user.id);
 if(error)return typeof say==='function'?say(error.message):null;
 const r=N.rows.find(x=>x.id===id);if(r)r.read_at=new Date().toISOString();ensureBellBadge();
 if(!document.getElementById('modal')?.classList.contains('hidden'))await openNotifications();
};
window.markAllIc49NotificationsRead=async function(){
 if(!S.session)return;
 const {error}=await sb.from('ic_notifications').update({read_at:new Date().toISOString()}).eq('user_id',S.session.user.id).is('read_at',null);
 if(error)return typeof say==='function'?say(error.message):null;
 N.rows.forEach(r=>{if(!r.read_at)r.read_at=new Date().toISOString()});ensureBellBadge();
 if(typeof say==='function')say('Toutes les notifications sont marquées comme lues.');await openNotifications();
};

async function markReadSilent(r){
 if(!r||r.read_at||!S.session)return;
 const {error}=await sb.from('ic_notifications').update({read_at:new Date().toISOString()}).eq('id',r.id).eq('user_id',S.session.user.id);
 if(!error)r.read_at=new Date().toISOString();ensureBellBadge();
}
async function openOrderNotification(r){
 if(typeof closeModal==='function')closeModal();
 if(window.icV48?.focusOrder){
   const ok=await window.icV48.focusOrder(r.link_id);
   if(ok){if(typeof say==='function')say('Transaction ouverte depuis votre notification.');return}
 }
 if(typeof go==='function')go('account');
 if(typeof say==='function')say('Transaction mise à jour. Retrouvez-la dans vos commandes et réservations.');
}
window.openIc49Notification=async function(id){
 const r=N.rows.find(x=>x.id===id);if(!r)return typeof say==='function'?say('Notification introuvable.'):null;
 await markReadSilent(r);
 if(r.link_type==='order'&&r.link_id)return openOrderNotification(r);
 if(r.link_type==='business'&&r.link_id&&typeof viewBusiness==='function'){closeModal();return viewBusiness(r.link_id)}
 if(r.link_type==='offer'&&typeof go==='function'){closeModal();return go('deals')}
 if(typeof closeModal==='function')closeModal();
 if(typeof say==='function')say(r.body||r.title||'Notification consultée.');
};

const baseOrders=window.ordersHtml;
if(typeof baseOrders==='function')window.ordersHtml=function(arr,pro=false){
 let html=baseOrders.call(this,arr,pro);
 for(const o of arr||[])html=html.replace('<article class="card">',`<article class="card" data-ic-order="${e49(o.id)}">`);
 return html;
};

function stopRealtime(){if(N.channel){try{sb.removeChannel(N.channel)}catch{}N.channel=null}N.user=null}
function startRealtime(){
 const uid=S.session?.user?.id||null;if(!uid){stopRealtime();return}
 if(N.channel&&N.user===uid)return;
 stopRealtime();N.user=uid;
 N.channel=sb.channel('ic-v49-notifications-'+uid)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'ic_notifications',filter:`user_id=eq.${uid}`},payload=>{
     const row=payload.new;if(row&&!N.rows.some(x=>x.id===row.id))N.rows.unshift(row);
     ensureBellBadge();if(typeof say==='function')say(`🔔 ${row?.title||'Nouvelle notification'}`);
   }).subscribe();
}

const baseLoadPrivate=window.loadPrivate;
if(typeof baseLoadPrivate==='function')window.loadPrivate=async function(...args){
 const r=await baseLoadPrivate.apply(this,args);
 if(S.session){await refreshBadge();startRealtime()}else{N.rows=[];stopRealtime();ensureBellBadge()}
 return r;
};

setTimeout(async()=>{ensureBellBadge();if(S.session){await refreshBadge();startRealtime()}},500);
window.addEventListener('focus',()=>{if(S.session)refreshBadge()});

window.icV49={version:V,loadNotifications,refreshBadge,startRealtime,unreadCount};
})();
