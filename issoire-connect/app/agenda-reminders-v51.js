(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const V='51.0';
const R={rows:[],handling:false,lastDeepLink:''};
const e51=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const logged=()=>!!S.session;
const REMINDERS=[
  [0,'Aucun rappel'],
  [30,'30 minutes avant'],
  [60,'1 heure avant'],
  [1440,'1 jour avant']
];
const reminderLabel=m=>({10:'10 min avant',15:'15 min avant',30:'30 min avant',60:'1 h avant',120:'2 h avant',1440:'1 jour avant'})[Number(m)]||`${Number(m)||0} min avant`;

async function rows(force=true){
 if(!logged()){R.rows=[];return R.rows}
 if(window.icAgenda?.load){
   try{R.rows=await window.icAgenda.load()||[];return R.rows}catch{}
 }
 const {data,error}=await sb.from('ic_personal_agenda').select('*').eq('user_id',S.session.user.id).order('starts_at',{ascending:true}).limit(500);
 if(error)throw error;R.rows=data||[];return R.rows;
}

function injectReminderField(current=60){
 const form=document.querySelector('#modalBody .form');
 if(!form||document.getElementById('icaReminder'))return;
 const save=document.getElementById('icaSave');
 const wrap=document.createElement('div');
 wrap.id='ic51ReminderField';
 wrap.innerHTML=`<label>🔔 Rappel</label><select id="icaReminder">${REMINDERS.map(([v,l])=>`<option value="${v}" ${Number(current||0)===v?'selected':''}>${l}</option>`).join('')}</select><div class="muted" style="margin-top:5px">Le rappel apparaîtra dans le centre 🔔 et sur votre téléphone/PC si les notifications Push sont activées.</div>`;
 if(save)form.insertBefore(wrap,save);else form.appendChild(wrap);
}

const baseOpenAgendaForm=window.openIcAgendaForm;
if(typeof baseOpenAgendaForm==='function')window.openIcAgendaForm=async function(id=''){
 let item=null;
 if(id){
   try{const list=await rows(true);item=list.find(x=>String(x.id)===String(id))||null}catch{}
 }
 const out=baseOpenAgendaForm.call(this,id);
 injectReminderField(item?.reminder_minutes??60);
 return out;
};

window.saveIcAgendaItem=async function(id=''){
 if(!logged())return typeof authModal==='function'?authModal('agenda'):null;
 const title=document.getElementById('icaTitle')?.value.trim()||'';
 const startRaw=document.getElementById('icaStart')?.value||'';
 const endRaw=document.getElementById('icaEnd')?.value||'';
 if(!title)return typeof say==='function'?say('Indiquez le titre du rendez-vous.'):null;
 if(!startRaw)return typeof say==='function'?say('Indiquez la date et l’heure.'):null;
 const starts_at=new Date(startRaw).toISOString();
 const ends_at=endRaw?new Date(endRaw).toISOString():null;
 if(ends_at&&new Date(ends_at)<new Date(starts_at))return typeof say==='function'?say('L’heure de fin doit être après le début.'):null;
 const rawReminder=Number(document.getElementById('icaReminder')?.value||0);
 const reminder_minutes=rawReminder>0?rawReminder:null;
 const payload={
   title,starts_at,ends_at,reminder_minutes,
   place:document.getElementById('icaPlace')?.value.trim()||null,
   notes:document.getElementById('icaNotes')?.value.trim()||null,
   updated_at:new Date().toISOString()
 };
 const btn=document.getElementById('icaSave');
 if(btn){btn.disabled=true;btn.textContent='Enregistrement…'}
 const q=id
   ?sb.from('ic_personal_agenda').update(payload).eq('id',id).eq('user_id',S.session.user.id)
   :sb.from('ic_personal_agenda').insert({...payload,user_id:S.session.user.id});
 const {error}=await q;
 if(error){if(btn){btn.disabled=false;btn.textContent='💾 Enregistrer'}return typeof say==='function'?say(error.message):null}
 if(typeof closeModal==='function')closeModal();
 if(typeof say==='function')say(id?'Rendez-vous mis à jour.':'Rendez-vous ajouté avec son rappel.');
 R.rows=[];
 if(typeof renderIcAgenda==='function')await renderIcAgenda();
};

function decorateCards(list){
 for(const item of list||[]){
   const card=[...document.querySelectorAll('[data-agenda-id]')].find(el=>String(el.dataset.agendaId)===String(item.id));
   if(!card||card.querySelector('.ic51-reminder-pill'))continue;
   const m=Number(item.reminder_minutes||0);
   if(!m)continue;
   const pill=document.createElement('span');
   pill.className='pill ic51-reminder-pill';
   pill.textContent=`🔔 ${reminderLabel(m)}`;
   const actions=card.querySelector('.actions');
   if(actions)card.insertBefore(pill,actions);else card.appendChild(pill);
 }
}

const baseRenderAgenda=window.renderIcAgenda;
if(typeof baseRenderAgenda==='function')window.renderIcAgenda=async function(...args){
 const out=await baseRenderAgenda.apply(this,args);
 if(logged()){
   try{const list=await rows(true);decorateCards(list)}catch{}
 }
 return out;
};
if(window.icAgenda)window.icAgenda.render=window.renderIcAgenda;

// Les événements ajoutés depuis Issoire Connect reçoivent par défaut un rappel 1 h avant.
window.addIcEventToAgenda=async function(eventId){
 if(!logged())return typeof authModal==='function'?authModal('events'):null;
 const ev=(S.events||[]).find(x=>String(x.id)===String(eventId));
 if(!ev)return typeof say==='function'?say('Événement introuvable.'):null;
 const {data:already,error:checkError}=await sb.from('ic_personal_agenda').select('id').eq('user_id',S.session.user.id).eq('source_event_id',eventId).maybeSingle();
 if(checkError)return typeof say==='function'?say(checkError.message):null;
 if(already?.id)return typeof say==='function'?say('Cet événement est déjà dans votre agenda.'):null;
 const payload={user_id:S.session.user.id,title:ev.title||'Événement',starts_at:ev.starts_at,ends_at:ev.ends_at||null,place:ev.place||null,notes:ev.description||null,source_event_id:ev.id,reminder_minutes:60,updated_at:new Date().toISOString()};
 const {error}=await sb.from('ic_personal_agenda').insert(payload);
 if(error)return typeof say==='function'?say(error.message):null;
 if(typeof say==='function')say('Événement ajouté à votre agenda avec un rappel 1 h avant.');
};

async function focusAgendaItem(agendaId){
 if(!logged())return false;
 if(S.page!=='agenda'&&typeof go==='function')go('agenda');
 for(let i=0;i<14;i++){
   if(typeof renderIcAgenda==='function')await renderIcAgenda();
   const card=[...document.querySelectorAll('[data-agenda-id]')].find(el=>String(el.dataset.agendaId)===String(agendaId));
   if(card){
     card.scrollIntoView({behavior:'smooth',block:'center'});
     const old=card.style.boxShadow;
     card.style.boxShadow='0 0 0 3px rgba(244,119,33,.35),0 10px 30px rgba(18,61,115,.15)';
     setTimeout(()=>{card.style.boxShadow=old},2600);
     return true;
   }
   await new Promise(r=>setTimeout(r,160));
 }
 return false;
}

async function markNotificationRead(notificationId){
 if(!notificationId||!logged())return;
 await sb.from('ic_notifications').update({read_at:new Date().toISOString()}).eq('id',notificationId).eq('user_id',S.session.user.id);
 try{await window.icV49?.refreshBadge?.()}catch{}
}

const baseOpenIc49Notification=window.openIc49Notification;
if(typeof baseOpenIc49Notification==='function')window.openIc49Notification=async function(notificationId){
 try{
   const list=await window.icV49?.loadNotifications?.(true)||[];
   const n=list.find(x=>String(x.id)===String(notificationId));
   if(n?.link_type==='agenda'&&n.link_id){
     await markNotificationRead(n.id);
     if(typeof closeModal==='function')closeModal();
     const ok=await focusAgendaItem(n.link_id);
     if(typeof say==='function')say(ok?'Rendez-vous ouvert depuis votre rappel.':'Rendez-vous introuvable dans votre agenda.');
     return;
   }
 }catch{}
 return baseOpenIc49Notification.apply(this,arguments);
};

function deepLink(){
 try{
   const u=new URL(location.href);
   if(u.searchParams.get('notification')!=='agenda')return null;
   const id=u.searchParams.get('id')||'';
   const notificationId=u.searchParams.get('notification_id')||'';
   return id?{id,notificationId,key:`${id}:${notificationId}`} : null;
 }catch{return null}
}
function cleanDeepLink(){
 try{
   const u=new URL(location.href);
   u.searchParams.delete('notification');u.searchParams.delete('id');u.searchParams.delete('notification_id');
   history.replaceState(null,'',u.pathname+(u.search?'?'+u.searchParams.toString():'')+u.hash);
 }catch{}
}
async function handleDeepLink(){
 const d=deepLink();
 if(!d||R.handling||R.lastDeepLink===d.key||!logged())return false;
 R.handling=true;
 try{
   if(d.notificationId)await markNotificationRead(d.notificationId);
   const ok=await focusAgendaItem(d.id);
   if(ok){R.lastDeepLink=d.key;cleanDeepLink();if(typeof say==='function')say('⏰ Rappel ouvert dans votre agenda.');return true}
   return false;
 }finally{R.handling=false}
}

const baseLoadPrivate=window.loadPrivate;
if(typeof baseLoadPrivate==='function')window.loadPrivate=async function(...args){
 const out=await baseLoadPrivate.apply(this,args);
 setTimeout(handleDeepLink,80);
 return out;
};

setTimeout(()=>{if(S.page==='agenda'&&typeof renderIcAgenda==='function')renderIcAgenda();handleDeepLink()},450);
window.icV51={version:V,rows,focusAgendaItem,handleDeepLink,reminderLabel};
})();
