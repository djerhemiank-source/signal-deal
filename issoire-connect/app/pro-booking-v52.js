(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const V='52.0';
const B={business:null,config:null,services:[],appointments:[],timer:null,pending:false};
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const logged=()=>!!S.session;
const DAYS=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const dt=v=>{try{return new Date(v).toLocaleString('fr-FR',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}catch{return'—'}};
const time=v=>{try{return new Date(v).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}catch{return'—'}};
const dateInput=d=>{const x=d||new Date();return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const statusLabel=s=>({pending:'En attente de confirmation',confirmed:'Confirmé',completed:'Terminé',cancelled:'Annulé'})[s]||s;

async function config(businessId){
 const {data,error}=await sb.rpc('ic_business_booking_config',{p_business:businessId});
 if(error)throw error;return data||null;
}
async function services(businessId){
 const {data,error}=await sb.from('ic_products').select('id,name,description,price,price_label,duration_minutes,requires_quote,service_location').eq('business_id',businessId).eq('is_active',true).eq('kind','service').order('created_at',{ascending:false}).limit(100);
 if(error)throw error;return data||[];
}

async function decorateBusinessBooking(businessId){
 const body=document.getElementById('modalBody');
 if(!body||B.business!==businessId||document.getElementById('ic52PublicBooking'))return;
 try{
   const [cfg,svcs]=await Promise.all([config(businessId),services(businessId)]);
   if(B.business!==businessId||!cfg?.enabled||!svcs.length)return;
   const host=document.createElement('section');host.id='ic52PublicBooking';host.className='card';host.style.marginTop='14px';
   host.innerHTML=`<div class="row between" style="gap:12px"><div><span class="pill">📅 RENDEZ-VOUS EN LIGNE</span><h3 style="margin:7px 0 3px">Choisir un créneau</h3><div class="muted">${svcs.length} prestation(s) réservable(s) · confirmation ${cfg.auto_confirm?'immédiate':'par le professionnel'}</div></div><button class="btn brand" onclick="openIc52Booking('${e(businessId)}')">📅 Prendre rendez-vous</button></div>`;
   body.appendChild(host);
 }catch{}
}

const baseViewBusiness=window.viewBusiness;
if(typeof baseViewBusiness==='function')window.viewBusiness=async function(id,...args){
 B.business=String(id);const out=await baseViewBusiness.call(this,id,...args);setTimeout(()=>decorateBusinessBooking(String(id)),120);return out;
};

function serviceOptions(){return B.services.map(s=>`<option value="${e(s.id)}">${e(s.name)}${s.duration_minutes?` · ${Number(s.duration_minutes)} min`:''}</option>`).join('')}
window.openIc52Booking=async function(businessId){
 B.business=String(businessId);
 if(!logged()){
   try{sessionStorage.setItem('ic52_pending_booking',B.business)}catch{}
   if(typeof authModal==='function')return authModal('account');
   return;
 }
 if(typeof openModal==='function')openModal('<h2>📅 Prendre rendez-vous</h2><div class="empty">Chargement des disponibilités…</div>');
 try{
   const [cfg,svcs]=await Promise.all([config(B.business),services(B.business)]);B.config=cfg;B.services=svcs;
   if(!cfg?.enabled)throw new Error('La prise de rendez-vous en ligne n’est pas activée pour ce professionnel.');
   if(!svcs.length)throw new Error('Aucune prestation réservable actuellement.');
   const today=new Date();const max=new Date();max.setDate(max.getDate()+Number(cfg.booking_horizon_days||30));
   modalBody.innerHTML=`<h2>📅 Prendre rendez-vous</h2><div class="notice"><b>${e(cfg.business_name||'Professionnel')}</b><br>Choisissez une prestation puis une date. Les créneaux déjà pris disparaissent automatiquement.</div><div class="form" style="margin-top:12px"><label>Prestation</label><select id="ic52Service" onchange="loadIc52Slots()">${serviceOptions()}</select><label>Date</label><input id="ic52Date" type="date" min="${dateInput(today)}" max="${dateInput(max)}" value="${dateInput(today)}" onchange="loadIc52Slots()"><div id="ic52Slots" class="empty">Recherche des créneaux…</div></div>`;
   await loadIc52Slots();
 }catch(err){modalBody.innerHTML=`<h2>📅 Rendez-vous</h2><div class="notice"><b>Indisponible pour le moment.</b><br>${e(err?.message||err)}</div>`}
};

window.loadIc52Slots=async function(){
 const host=document.getElementById('ic52Slots');if(!host||!B.config)return;
 const serviceId=document.getElementById('ic52Service')?.value||null,date=document.getElementById('ic52Date')?.value||'';
 if(!serviceId||!date){host.className='empty';host.textContent='Choisissez une prestation et une date.';return}
 host.className='empty';host.textContent='Recherche des créneaux…';
 const {data,error}=await sb.rpc('ic_business_booking_slots',{p_business:B.business,p_service:serviceId,p_date:date});
 if(error){host.innerHTML=e(error.message);return}
 const rows=data||[];host.className='';
 if(!rows.length){host.innerHTML='<div class="empty">Aucun créneau disponible ce jour.</div>';return}
 host.innerHTML=`<div class="muted" style="margin-bottom:8px">${rows.length} créneau(x) disponible(s)</div><div class="actions">${rows.map(r=>`<button class="btn" onclick="confirmIc52Slot('${e(r.starts_at)}','${e(r.ends_at)}')">${e(time(r.starts_at))}</button>`).join('')}</div>`;
};

window.confirmIc52Slot=function(start,end){
 const sid=document.getElementById('ic52Service')?.value||'';const svc=B.services.find(x=>String(x.id)===String(sid));
 openModal(`<h2>Confirmer le rendez-vous</h2><div class="card"><span class="pill">📅 ${e(dt(start))}</span><h3>${e(svc?.name||'Prestation')}</h3><div class="muted">${e(B.config?.business_name||'Professionnel')} · ${e(time(start))} → ${e(time(end))}</div></div><div class="form" style="margin-top:12px"><label>Message au professionnel — facultatif</label><textarea id="ic52BookNote" maxlength="2000" rows="4" placeholder="Précision utile pour ce rendez-vous"></textarea><div class="actions"><button class="btn" onclick="openIc52Booking('${e(B.business)}')">← Retour</button><button id="ic52BookBtn" class="btn brand" onclick="bookIc52Slot('${e(sid)}','${e(start)}')">✓ Confirmer ce créneau</button></div></div>`);
};
window.bookIc52Slot=async function(serviceId,start){
 if(!logged())return openIc52Booking(B.business);
 const btn=document.getElementById('ic52BookBtn');if(btn){btn.disabled=true;btn.textContent='Réservation…'}
 const note=document.getElementById('ic52BookNote')?.value.trim()||null;
 const {data,error}=await sb.rpc('ic_book_appointment',{p_business:B.business,p_service:serviceId,p_start:start,p_note:note});
 if(error){if(btn){btn.disabled=false;btn.textContent='✓ Confirmer ce créneau'}return typeof say==='function'?say(error.message):null}
 if(typeof closeModal==='function')closeModal();
 if(typeof say==='function')say(data?.status==='pending'?'Demande de rendez-vous envoyée.':'Rendez-vous confirmé et ajouté à votre agenda.');
 await loadAppointments();if(S.page==='account')renderAppointmentPanel();
};

function dayPeriods(cfg,day){const a=(cfg?.hours||[]).filter(x=>Number(x.weekday)===day);return [a[0]||null,a[1]||null]}
function hoursRow(day,cfg){
 const periods=dayPeriods(cfg,day),active=periods.length>0;
 return `<div class="card" style="padding:10px"><div class="row between"><b>${DAYS[day]}</b><label style="display:flex;align-items:center;gap:6px"><input id="ic52day${day}" type="checkbox" ${active?'checked':''}> Ouvert aux RDV</label></div><div class="two" style="margin-top:8px"><div><label>Période 1</label><div class="two"><input id="ic52s1_${day}" type="time" value="${e(periods[0]?.start||'09:00')}"><input id="ic52e1_${day}" type="time" value="${e(periods[0]?.end||'12:00')}"></div></div><div><label>Période 2 — facultative</label><div class="two"><input id="ic52s2_${day}" type="time" value="${e(periods[1]?.start||'14:00')}"><input id="ic52e2_${day}" type="time" value="${e(periods[1]?.end||'18:00')}"></div></div></div></div>`;
}
window.openIc52BookingSettings=async function(businessId){
 if(!logged())return authModal('account');B.business=String(businessId);openModal('<h2>📅 Disponibilités rendez-vous</h2><div class="empty">Chargement…</div>');
 try{
   const cfg=await config(B.business);B.config=cfg||{};
   modalBody.innerHTML=`<h2>📅 Disponibilités & rendez-vous</h2><div class="notice"><b>Pro 360</b> · Définissez ici les horaires réellement réservables. Les horaires d’ouverture publics restent indépendants.</div><div class="form" style="margin-top:12px"><label style="display:flex;align-items:center;gap:7px"><input id="ic52Enabled" type="checkbox" ${cfg?.enabled?'checked':''}> Activer « Prendre rendez-vous » sur ma fiche</label><div class="two"><div><label>Pas entre les créneaux</label><select id="ic52Step">${[15,30,45,60,90,120].map(x=>`<option value="${x}" ${Number(cfg?.slot_minutes||30)===x?'selected':''}>${x} min</option>`).join('')}</select></div><div><label>Réservable jusqu’à</label><select id="ic52Horizon">${[7,14,30,60,90].map(x=>`<option value="${x}" ${Number(cfg?.booking_horizon_days||30)===x?'selected':''}>${x} jours</option>`).join('')}</select></div></div><div class="two"><div><label>Délai minimum</label><select id="ic52Notice">${[[0,'Immédiatement'],[60,'1 h'],[120,'2 h'],[1440,'24 h']].map(([x,l])=>`<option value="${x}" ${Number(cfg?.min_notice_minutes??120)===x?'selected':''}>${l}</option>`).join('')}</select></div><div><label>Confirmation</label><select id="ic52Auto"><option value="1" ${cfg?.auto_confirm!==false?'selected':''}>Automatique</option><option value="0" ${cfg?.auto_confirm===false?'selected':''}>Validation manuelle</option></select></div></div><h3>Horaires réservables</h3>${[1,2,3,4,5,6,0].map(d=>hoursRow(d,cfg)).join('')}<button id="ic52SaveSettings" class="btn brand" onclick="saveIc52BookingSettings()">💾 Enregistrer les disponibilités</button></div>`;
 }catch(err){modalBody.innerHTML=`<h2>📅 Disponibilités</h2><div class="notice">${e(err?.message||err)}</div>`}
};
window.saveIc52BookingSettings=async function(){
 const hours=[];
 for(let d=0;d<7;d++){
   if(!document.getElementById(`ic52day${d}`)?.checked)continue;
   for(const n of [1,2]){
     const start=document.getElementById(`ic52s${n}_${d}`)?.value||'',end=document.getElementById(`ic52e${n}_${d}`)?.value||'';
     if(start&&end&&start<end)hours.push({weekday:d,start,end});
   }
 }
 const btn=document.getElementById('ic52SaveSettings');if(btn){btn.disabled=true;btn.textContent='Enregistrement…'}
 const {data,error}=await sb.rpc('ic_save_booking_settings',{p_business:B.business,p_enabled:!!document.getElementById('ic52Enabled')?.checked,p_slot_minutes:Number(document.getElementById('ic52Step')?.value||30),p_horizon_days:Number(document.getElementById('ic52Horizon')?.value||30),p_min_notice_minutes:Number(document.getElementById('ic52Notice')?.value||120),p_auto_confirm:document.getElementById('ic52Auto')?.value!=='0',p_hours:hours});
 if(error){if(btn){btn.disabled=false;btn.textContent='💾 Enregistrer les disponibilités'}return typeof say==='function'?say(error.message):null}
 B.config=data;if(typeof closeModal==='function')closeModal();if(typeof say==='function')say('Disponibilités de rendez-vous enregistrées.');
};

async function loadAppointments(){
 if(!logged()){B.appointments=[];return[]}
 const {data,error}=await sb.rpc('ic_my_appointments',{p_limit:100});if(error)throw error;B.appointments=data||[];return B.appointments;
}
function appointmentActions(a){
 const owner=!!a.is_business_owner;
 if(owner&&a.status==='pending')return `<button class="btn green small" onclick="setIc52Appointment('${e(a.id)}','confirmed')">Confirmer</button><button class="btn red small" onclick="setIc52Appointment('${e(a.id)}','cancelled')">Refuser</button>`;
 if(owner&&a.status==='confirmed')return `<button class="btn brand small" onclick="setIc52Appointment('${e(a.id)}','completed')">✓ Terminé</button><button class="btn red small" onclick="setIc52Appointment('${e(a.id)}','cancelled')">Annuler</button>`;
 if(!owner&&['pending','confirmed'].includes(a.status))return `<button class="btn red small" onclick="setIc52Appointment('${e(a.id)}','cancelled')">Annuler mon rendez-vous</button>`;
 if(!owner&&a.can_review)return `<button class="btn brand small" onclick="openIc48VerifiedReview('', '${e(a.business_id)}')">⭐ Donner un avis vérifié</button>`;
 return '';
}
function appointmentCard(a){return `<article class="card" data-ic-appointment="${e(a.id)}"><div class="row between"><div><span class="pill">${a.is_business_owner?'🏪 CLIENT':'📅 RENDEZ-VOUS'}</span><h3 style="margin:7px 0 3px">${e(a.is_business_owner?a.client_name:a.business_name)}</h3><div class="muted">${e(a.service_name||'Prestation')}</div></div><span class="status ${e(a.status)}">${e(statusLabel(a.status))}</span></div><p><b>${e(dt(a.starts_at))}</b> → ${e(time(a.ends_at))}</p>${a.note?`<p>${e(a.note)}</p>`:''}${appointmentActions(a)?`<div class="actions">${appointmentActions(a)}</div>`:''}</article>`}
async function renderAppointmentPanel(){
 if(!logged()||S.page!=='account')return;const root=document.getElementById('main');if(!root)return;
 let host=document.getElementById('ic52Appointments');if(!host){host=document.createElement('section');host.id='ic52Appointments';host.style.margin='14px 0';const tx=document.getElementById('ic48TransactionExperience');if(tx?.parentNode)tx.insertAdjacentElement('afterend',host);else root.prepend(host)}
 try{await loadAppointments();const useful=B.appointments.slice(0,30);if(!useful.length){host.remove();return}host.innerHTML=`<div class="sectionhead" style="margin-top:0"><div><span class="pill">📅 RENDEZ-VOUS</span><h2 style="margin-top:7px">Mes rendez-vous</h2><p>Vos réservations de créneaux, côté client et professionnel.</p></div></div><div class="cards">${useful.map(appointmentCard).join('')}</div>`}catch(err){host.innerHTML=`<div class="notice">Impossible de charger les rendez-vous : ${e(err?.message||err)}</div>`}
}
window.setIc52Appointment=async function(id,status){
 if(status==='cancelled'&&!confirm('Annuler ce rendez-vous ?'))return;
 const {error}=await sb.rpc('ic_set_appointment_status',{p_appointment:id,p_status:status});if(error)return typeof say==='function'?say(error.message):null;
 if(typeof say==='function')say(`Rendez-vous : ${statusLabel(status)}.`);await loadAppointments();renderAppointmentPanel();if(typeof loadPrivate==='function')loadPrivate();
};

function injectProManager(){
 if(!logged()||S.page!=='account'||!Array.isArray(S.myBusinesses)||!S.myBusinesses.length)return;const root=document.getElementById('main');if(!root||document.getElementById('ic52ProBookingManager'))return;
 const host=document.createElement('section');host.id='ic52ProBookingManager';host.className='card';host.style.margin='14px 0';host.innerHTML=`<span class="pill">📅 PRO 360</span><h3 style="margin:7px 0 3px">Prise de rendez-vous</h3><p class="muted">Publiez vos disponibilités et laissez les habitants réserver un créneau réel. Les rendez-vous confirmés arrivent automatiquement dans vos agendas.</p><div class="actions">${S.myBusinesses.map(b=>`<button class="btn brand" onclick="openIc52BookingSettings('${e(b.id)}')">⚙️ Disponibilités · ${e(b.name)}</button>`).join('')}</div>`;root.appendChild(host);
}

async function focusAppointment(id){
 if(!logged())return false;if(S.page!=='account'&&typeof go==='function')go('account');
 for(let i=0;i<12;i++){await renderAppointmentPanel();const card=[...document.querySelectorAll('[data-ic-appointment]')].find(x=>String(x.dataset.icAppointment)===String(id));if(card){card.scrollIntoView({behavior:'smooth',block:'center'});const old=card.style.boxShadow;card.style.boxShadow='0 0 0 3px rgba(244,119,33,.35),0 10px 30px rgba(18,61,115,.15)';setTimeout(()=>card.style.boxShadow=old,2600);return true}await new Promise(r=>setTimeout(r,160))}return false;
}
const baseNotif=window.openIc49Notification;
if(typeof baseNotif==='function')window.openIc49Notification=async function(notificationId){
 try{const list=await window.icV49?.loadNotifications?.(true)||[];const n=list.find(x=>String(x.id)===String(notificationId));if(n?.link_type==='appointment'&&n.link_id){await sb.from('ic_notifications').update({read_at:new Date().toISOString()}).eq('id',n.id).eq('user_id',S.session.user.id);if(typeof closeModal==='function')closeModal();const ok=await focusAppointment(n.link_id);if(typeof say==='function')say(ok?'Rendez-vous ouvert.':'Rendez-vous introuvable.');return}}catch{}
 return baseNotif.apply(this,arguments);
};

function schedule(){clearTimeout(B.timer);B.timer=setTimeout(()=>{injectProManager();renderAppointmentPanel()},180)}
const baseGo=window.go;if(typeof baseGo==='function')window.go=function(page,...args){const out=baseGo.call(this,page,...args);if(page==='account')schedule();return out};
const baseLoad=window.loadPrivate;if(typeof baseLoad==='function')window.loadPrivate=async function(...args){const out=await baseLoad.apply(this,args);schedule();try{const pending=sessionStorage.getItem('ic52_pending_booking');if(pending&&logged()){sessionStorage.removeItem('ic52_pending_booking');setTimeout(()=>openIc52Booking(pending),250)}}catch{}return out};
const root=document.getElementById('main');if(root)new MutationObserver(()=>{if(S.page==='account')schedule()}).observe(root,{childList:true,subtree:false});
setTimeout(schedule,450);
window.icV52={version:V,config,services,loadAppointments,renderAppointmentPanel,focusAppointment};
})();
