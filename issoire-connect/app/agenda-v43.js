(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const A={rows:[],view:'upcoming'};
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const logged=()=>!!S.session;
const localInput=v=>{if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return'';const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
const fmtDate=v=>new Date(v).toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
const fmtTime=v=>new Date(v).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
const isPast=r=>new Date(r.ends_at||r.starts_at).getTime()<Date.now();

async function loadAgenda(){
 if(!logged()){A.rows=[];return[]}
 const {data,error}=await sb.from('ic_personal_agenda').select('*').eq('user_id',S.session.user.id).order('starts_at',{ascending:true}).limit(500);
 if(error)throw error;A.rows=data||[];return A.rows;
}
function appointmentCard(r){
 return `<article class="card" data-agenda-id="${e(r.id)}"><div class="row between"><div><span class="pill">${isPast(r)?'⚪ PASSÉ':'🟢 À VENIR'}</span><h3 style="margin:7px 0 3px">${e(r.title)}</h3></div><div style="text-align:right"><strong>${e(fmtTime(r.starts_at))}</strong><div class="muted">${e(fmtDate(r.starts_at))}</div></div></div>${r.ends_at?`<div class="muted">Jusqu’à ${e(fmtTime(r.ends_at))}</div>`:''}${r.place?`<p>📍 ${e(r.place)}</p>`:''}${r.notes?`<p>${e(r.notes)}</p>`:''}${r.source_event_id?'<span class="pill">📅 Événement Issoire Connect</span>':''}<div class="actions"><button class="btn brand" onclick="openIcAgendaForm('${e(r.id)}')">✏️ Modifier</button><button class="btn" onclick="deleteIcAgendaItem('${e(r.id)}')">🗑 Supprimer</button></div></article>`;
}
function agendaRows(){return A.rows.filter(r=>A.view==='past'?isPast(r):!isPast(r));}
window.renderIcAgenda=async function(){
 if(typeof main==='undefined'||!main)return;
 if(!logged()){
  main.innerHTML=`<div class="sectionhead"><div><h2>🗓️ Mon agenda</h2><p>Vos rendez-vous personnels dans Issoire Connect.</p></div></div><div class="card"><h3>Agenda personnel privé</h3><p>Connectez-vous pour noter vos rendez-vous, lieux et informations utiles.</p><button class="btn brand" onclick="authModal('agenda')">Connexion / inscription</button></div>`;
  return;
 }
 main.innerHTML='<div class="sectionhead"><div><h2>🗓️ Mon agenda</h2><p>Chargement de vos rendez-vous…</p></div></div><div class="empty">Chargement…</div>';
 try{await loadAgenda()}catch(err){main.innerHTML=`<div class="notice"><b>Impossible de charger votre agenda.</b><br>${e(err?.message||err)}</div>`;return}
 const rows=agendaRows(),next=A.rows.find(r=>!isPast(r));
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">🔒 PRIVÉ</span><h2 style="margin-top:8px">🗓️ Mon agenda</h2><p>Seul votre compte peut voir ces rendez-vous.</p></div><div class="actions"><button class="btn" onclick="go('home')">🏠 Accueil</button><button class="btn brand" onclick="openIcAgendaForm()">➕ Nouveau rendez-vous</button></div></div>${next?`<div class="notice"><b>Prochain rendez-vous :</b> ${e(next.title)} · ${e(fmtDate(next.starts_at))} à ${e(fmtTime(next.starts_at))}${next.place?' · 📍 '+e(next.place):''}</div>`:'<div class="notice"><b>Aucun rendez-vous à venir.</b> Utilisez « Nouveau rendez-vous » pour en ajouter un.</div>'}<div class="tabs" style="margin:14px 0"><button class="${A.view==='upcoming'?'active':''}" onclick="setIcAgendaView('upcoming')">À venir (${A.rows.filter(r=>!isPast(r)).length})</button><button class="${A.view==='past'?'active':''}" onclick="setIcAgendaView('past')">Passés (${A.rows.filter(isPast).length})</button></div>${rows.length?`<div class="cards">${rows.map(appointmentCard).join('')}</div>`:`<div class="empty">${A.view==='past'?'Aucun ancien rendez-vous.':'Aucun rendez-vous à venir.'}</div>`}`;
};
window.setIcAgendaView=function(view){A.view=view==='past'?'past':'upcoming';renderIcAgenda()};
window.openIcAgendaForm=function(id=''){
 if(!logged())return authModal('agenda');
 const r=id?A.rows.find(x=>x.id===id):null;if(id&&!r)return say('Rendez-vous introuvable.');
 const defaultStart=new Date(Date.now()+3600000);defaultStart.setMinutes(Math.ceil(defaultStart.getMinutes()/15)*15,0,0);
 const start=localInput(r?.starts_at||defaultStart),end=localInput(r?.ends_at||'');
 openModal(`<h2>${r?'✏️ Modifier le rendez-vous':'➕ Nouveau rendez-vous'}</h2><div class="notice">🔒 Ce rendez-vous reste privé dans votre compte Issoire Connect.</div><div class="form" style="margin-top:12px"><label>Titre *</label><input id="icaTitle" maxlength="160" value="${e(r?.title||'')}" placeholder="Médecin, garage, client, coiffeur…"><div class="two"><div><label>Date et heure *</label><input id="icaStart" type="datetime-local" value="${e(start)}"></div><div><label>Fin — facultatif</label><input id="icaEnd" type="datetime-local" value="${e(end)}"></div></div><label>Lieu — facultatif</label><input id="icaPlace" maxlength="250" value="${e(r?.place||'')}" placeholder="Adresse, cabinet, entreprise…"><label>Notes — facultatif</label><textarea id="icaNotes" rows="5" maxlength="3000" placeholder="Informations utiles pour ce rendez-vous">${e(r?.notes||'')}</textarea><button id="icaSave" class="btn brand" onclick="saveIcAgendaItem('${e(id)}')">💾 ${r?'Enregistrer':'Ajouter à mon agenda'}</button></div>`);
};
window.saveIcAgendaItem=async function(id=''){
 if(!logged())return authModal('agenda');
 const title=document.getElementById('icaTitle')?.value.trim()||'',startRaw=document.getElementById('icaStart')?.value||'',endRaw=document.getElementById('icaEnd')?.value||'';
 if(!title)return say('Indiquez le titre du rendez-vous.');if(!startRaw)return say('Indiquez la date et l’heure.');
 const starts_at=new Date(startRaw).toISOString(),ends_at=endRaw?new Date(endRaw).toISOString():null;if(ends_at&&new Date(ends_at)<new Date(starts_at))return say('L’heure de fin doit être après le début.');
 const payload={title,starts_at,ends_at,place:document.getElementById('icaPlace')?.value.trim()||null,notes:document.getElementById('icaNotes')?.value.trim()||null,updated_at:new Date().toISOString()};
 const btn=document.getElementById('icaSave');if(btn){btn.disabled=true;btn.textContent='Enregistrement…'}
 const q=id?sb.from('ic_personal_agenda').update(payload).eq('id',id).eq('user_id',S.session.user.id):sb.from('ic_personal_agenda').insert({...payload,user_id:S.session.user.id});
 const {error}=await q;if(error){if(btn){btn.disabled=false;btn.textContent='💾 Enregistrer'}return say(error.message)}closeModal();say(id?'Rendez-vous mis à jour.':'Rendez-vous ajouté à votre agenda.');await renderIcAgenda();
};
window.deleteIcAgendaItem=function(id){const r=A.rows.find(x=>x.id===id);if(!r)return;openModal(`<h2>🗑 Supprimer ce rendez-vous ?</h2><p><b>${e(r.title)}</b><br>${e(fmtDate(r.starts_at))} à ${e(fmtTime(r.starts_at))}</p><div class="actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="confirmDeleteIcAgendaItem('${e(id)}')">Supprimer</button></div>`)};
window.confirmDeleteIcAgendaItem=async function(id){if(!logged())return;const {error}=await sb.from('ic_personal_agenda').delete().eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);closeModal();say('Rendez-vous supprimé.');await renderIcAgenda()};

window.addIcEventToAgenda=async function(eventId){
 if(!logged())return authModal('events');const ev=(S.events||[]).find(x=>x.id===eventId);if(!ev)return say('Événement introuvable.');
 const {data:already,error:checkError}=await sb.from('ic_personal_agenda').select('id').eq('user_id',S.session.user.id).eq('source_event_id',eventId).maybeSingle();if(checkError)return say(checkError.message);if(already?.id)return say('Cet événement est déjà dans votre agenda.');
 const payload={user_id:S.session.user.id,title:ev.title||'Événement',starts_at:ev.starts_at,ends_at:ev.ends_at||null,place:ev.place||null,notes:ev.description||null,source_event_id:ev.id,updated_at:new Date().toISOString()};
 const {error}=await sb.from('ic_personal_agenda').insert(payload);if(error)return say(error.message);say('Événement ajouté à votre agenda.')
};
function decoratePublicEvents(){
 if(typeof main==='undefined'||!main)return;
 const events=S.events||[];for(const card of main.querySelectorAll('.card')){
  if(card.querySelector('[data-add-agenda]'))continue;const title=card.querySelector('h3')?.textContent?.trim();if(!title)continue;const ev=events.find(x=>String(x.title||'').trim()===title);if(!ev)continue;
  let actions=card.querySelector('.actions');if(!actions){actions=document.createElement('div');actions.className='actions';card.appendChild(actions)}
  const b=document.createElement('button');b.className='btn';b.dataset.addAgenda='1';b.textContent='🗓️ Ajouter à mon agenda';b.onclick=()=>addIcEventToAgenda(ev.id);actions.appendChild(b);
 }
}

// Entrée Accueil : on ajoute Agenda sans recréer d’autres doublons.
window.menu=function(){
 const items=[['🏢','Entreprises & commerces','businesses'],['🔥','Bons plans','deals'],['💼','Emplois','jobs'],['📣','Annonces & besoins','classifieds'],['🗓️','Mon agenda','agenda'],['📅','Événements','events'],['📍','Autour de moi','nearby']];
 return `<div class="gridmenu">${items.map(x=>`<button class="tile" onclick="go('${x[2]}')"><span>${x[0]}</span><b>${x[1]}</b></button>`).join('')}</div>`;
};

const baseGo=window.go;
if(typeof baseGo==='function')window.go=function(page,...args){
 const r=baseGo.call(this,page,...args);
 if(page==='agenda')setTimeout(()=>renderIcAgenda(),0);
 if(page==='events')setTimeout(decoratePublicEvents,100);
 if(page==='home')setTimeout(()=>{if(typeof homePage==='function'&&S.page==='home')homePage()},0);
 return r;
};

setTimeout(()=>{if(S.page==='agenda')renderIcAgenda();if(S.page==='events')decoratePublicEvents()},250);
window.icAgenda={version:'43.0',load:loadAgenda,render:window.renderIcAgenda};
})();
