(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const V42={feed:[],q:'',kind:'all',city:'',maxPrice:'',adminUsers:[],pipeline:[]};
const RADII=[1,5,10,20,50];
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const business=()=>Array.isArray(S.myBusinesses)&&S.myBusinesses.length?S.myBusinesses[0]:null;
const isAdmin=()=>!!(S.session&&S.profile?.role==='admin');
const has360=()=>typeof window.icHasPro360==='function'?window.icHasPro360():isAdmin()||['pro','proplus'].includes(String(business()?.plan||''));
const require360=feature=>{if(has360())return true;if(typeof window.icRequirePro360==='function')return window.icRequirePro360(feature);if(typeof openIcPlans==='function')openIcPlans();return false};
const fmtDate=v=>{try{return new Date(v).toLocaleDateString('fr-FR')}catch{return ''}};
const fmtDateTime=v=>{try{return new Date(v).toLocaleString('fr-FR')}catch{return ''}};
const euro=v=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('fr-FR',{style:'currency',currency:'EUR'}):''};

// ---------------------------------------------------------------------------
// 1) ACCUEIL : une seule entrée par service. Les anciens doublons
//    « Invendus/Bons plans » et « Entraide/Petites annonces » disparaissent.
// ---------------------------------------------------------------------------
window.menu=function(){
 const items=[
  ['🏢','Entreprises & commerces','businesses'],
  ['🔥','Bons plans','deals'],
  ['💼','Emplois','jobs'],
  ['📣','Annonces & besoins','classifieds'],
  ['📅','Événements','events'],
  ['📍','Autour de moi','nearby']
 ];
 return `<div class="gridmenu">${items.map(x=>`<button class="tile" onclick="go('${x[2]}')"><span>${x[0]}</span><b>${x[1]}</b></button>`).join('')}</div>`;
};

async function refreshPublicCounters(){
 try{
  const {data,error}=await sb.from('ic_public_counters').select('user_count,professional_count,business_count').eq('id',1).maybeSingle();
  if(error||!data)return;
  S.stats=S.stats||{};S.stats.users=Number(data.user_count||0);S.stats.pros=Number(data.professional_count||0);
  const boxes=document.querySelectorAll('.communitystats .counterbox strong');
  if(boxes[0])boxes[0].textContent=S.stats.users.toLocaleString('fr-FR');
  if(boxes[1])boxes[1].textContent=S.stats.pros.toLocaleString('fr-FR');
 }catch{}
}
const baseHome=window.homePage;
if(typeof baseHome==='function')window.homePage=function(...args){const r=baseHome.apply(this,args);setTimeout(refreshPublicCounters,0);return r};

// ---------------------------------------------------------------------------
// 2) ANNONCES : une seule page pour les petites annonces ET les besoins locaux.
//    Les besoins restent dans ic_needs : on ne duplique aucune ligne en base.
// ---------------------------------------------------------------------------
const KIND_LABEL={vente:'Vente',recherche:'Recherche',don:'Don',echange:'Échange',service:'Service',logement:'Logement',immobilier:'Logement',besoin:'Besoin local'};
const NEED_LABEL={travaux:'Maison & travaux',auto:'Auto & mobilité',alimentation:'Alimentation / restaurant',sante:'Santé',services:'Services',impression:'Impression / communication',evenement:'Événement',autre:'Autre'};
const urgency=v=>v==='urgent'?'🔴 Urgent':v==='aujourd_hui'?'🟠 Aujourd’hui':'🟢 Normal';
function safeImage(v){if(!v)return null;try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}}
async function loadUnifiedFeed(){
 const [ads,needs]=await Promise.all([
  sb.from('ic_classifieds').select('id,user_id,kind,title,description,price,price_label,city,image_url,is_active,created_at').eq('is_active',true).order('created_at',{ascending:false}).limit(500),
  sb.rpc('ic_public_needs',{p_limit:250})
 ]);
 if(ads.error)throw ads.error;if(needs.error)throw needs.error;
 const a=(ads.data||[]).map(x=>({...x,_source:'classified',is_mine:!!(S.session&&x.user_id===S.session.user.id)}));
 const n=(needs.data||[]).map(x=>({
  _source:'need',id:'need:'+x.id,need_id:x.id,kind:'besoin',title:'Besoin local',description:x.need_text,city:x.city,
  price:null,price_label:null,image_url:null,created_at:x.created_at,is_mine:!!x.is_mine,category:x.category,urgency:x.urgency,
  radius_km:x.radius_km,status:x.status
 }));
 V42.feed=[...a,...n].sort((x,y)=>new Date(y.created_at)-new Date(x.created_at));
 return V42.feed;
}
function filteredFeed(){
 const q=fold(V42.q.trim()),city=fold(V42.city.trim()),max=V42.maxPrice===''?null:Number(V42.maxPrice);
 return V42.feed.filter(x=>{
  if(V42.kind!=='all'&&x.kind!==V42.kind)return false;
  if(q&&!fold([x.title,x.description,x.city,KIND_LABEL[x.kind]||x.kind,NEED_LABEL[x.category]||x.category].join(' ')).includes(q))return false;
  if(city&&!fold(x.city).includes(city))return false;
  if(max!=null&&Number.isFinite(max)&&x.price!=null&&Number(x.price)>max)return false;
  return true;
 });
}
function classifiedCard(a){
 const img=safeImage(a.image_url),price=a.price_label?e(a.price_label):(a.price!=null?euro(a.price):''),own=a.is_mine;
 return `<article class="card ic-public-ad"><div class="row between"><div><span class="pill">${e(KIND_LABEL[a.kind]||a.kind||'Annonce')}</span><h3 style="margin-top:7px">${e(a.title)}</h3></div>${price?`<strong>${e(price)}</strong>`:''}</div>${img?`<img src="${e(img)}" alt="" loading="lazy" style="width:100%;height:210px;object-fit:cover;border-radius:14px;margin:8px 0" onerror="this.remove()">`:''}<p>${e(a.description||'')}</p><div class="muted">📍 ${e(a.city||'Issoire')} · ${fmtDate(a.created_at)}</div><div class="actions" style="margin-top:10px">${own?'<button class="btn" onclick="go(\'account\')">✏️ Gérer mon annonce</button>':`<button class="btn brand" onclick="openV42ClassifiedContact('${e(a.id)}')">💬 Contacter</button>`}</div></article>`;
}
function needCard(n){
 const b=business(),canReply=!n.is_mine&&b&&has360()&&typeof window.replyIcNeed==='function';
 return `<article class="card ic-public-need" style="border-top:4px solid #f47721"><div class="row between"><div><span class="pill">🙋 BESOIN LOCAL</span><h3 style="margin:7px 0 3px">${e(NEED_LABEL[n.category]||'Besoin local')}</h3></div><span class="pill">${e(urgency(n.urgency))}</span></div><p>${e(n.description||'')}</p><div class="muted">📍 ${e(n.city||'Issoire')} · rayon ${Number(n.radius_km||10)} km · ${fmtDate(n.created_at)}</div><div class="actions" style="margin-top:10px">${n.is_mine?'<button class="btn brand" onclick="openIcMyNeeds()">✏️ Gérer mon besoin</button>':canReply?`<button class="btn brand" onclick="replyIcNeed('${e(n.need_id)}','${e(b.id)}')">💬 Répondre au besoin</button>`:'<span class="muted">Les professionnels Pro 360 compatibles peuvent répondre via Issoire Connect.</span>'}</div></article>`;
}
function unifiedControls(){
 return `<div class="card" style="margin-bottom:12px"><div class="two"><div><label>Recherche</label><input id="v42FeedQ" value="${e(V42.q)}" placeholder="vélo, plombier, meuble, service…"></div><div><label>Type</label><select id="v42FeedKind"><option value="all">Tout afficher</option>${Object.entries(KIND_LABEL).filter(([k])=>k!=='immobilier').map(([v,l])=>`<option value="${v}" ${V42.kind===v?'selected':''}>${e(l)}</option>`).join('')}</select></div></div><div class="two" style="margin-top:8px"><div><label>Ville / secteur</label><input id="v42FeedCity" value="${e(V42.city)}" placeholder="Issoire"></div><div><label>Prix maximum (€)</label><input id="v42FeedMax" type="number" min="0" step="1" value="${e(V42.maxPrice)}" placeholder="Sans limite"></div></div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="applyV42FeedFilters()">🔎 Filtrer</button><button class="btn" onclick="resetV42FeedFilters()">↺ Réinitialiser</button><button class="btn" onclick="openResidentClassifiedEntry()">➕ Déposer une annonce</button><button class="btn primary" onclick="openIcNeedRequest()">🙋 Publier un besoin</button>${S.session?'<button class="btn" onclick="openIcMyNeeds()">Mes besoins</button>':''}</div></div>`;
}
window.renderPublicClassifieds=async function(){
 if(typeof main==='undefined'||!main)return;
 main.innerHTML='<div class="sectionhead"><div><h2>📣 Annonces & besoins locaux</h2><p>Chargement…</p></div></div><div class="empty">Chargement…</div>';
 try{await loadUnifiedFeed()}catch(err){main.innerHTML=`<div class="notice"><b>Impossible de charger les annonces et besoins.</b><br>${e(err?.message||err)}</div>`;return}
 const rows=filteredFeed();
 main.innerHTML=`<div class="sectionhead"><div><h2>📣 Annonces & besoins locaux</h2><p>${rows.length} publication(s) visible(s) : vente, don, recherche, services et besoins des habitants.</p></div><div class="actions"><button class="btn brand" onclick="openResidentClassifiedEntry()">➕ Annonce</button><button class="btn primary" onclick="openIcNeedRequest()">🙋 Besoin</button></div></div><div class="notice"><b>Un seul endroit pour les publications locales.</b><br>Un besoin publié dans « J’ai besoin de… » apparaît ici automatiquement, sans créer de doublon dans la base.</div>${unifiedControls()}${rows.length?`<div class="cards">${rows.slice(0,160).map(x=>x._source==='need'?needCard(x):classifiedCard(x)).join('')}</div>${rows.length>160?'<div class="notice">Affichage limité aux 160 premières publications. Utilisez les filtres pour affiner.</div>':''}`:'<div class="empty">Aucune publication ne correspond aux filtres.</div>'}`;
};
window.applyV42FeedFilters=function(){V42.q=document.getElementById('v42FeedQ')?.value||'';V42.kind=document.getElementById('v42FeedKind')?.value||'all';V42.city=document.getElementById('v42FeedCity')?.value||'';V42.maxPrice=document.getElementById('v42FeedMax')?.value||'';renderPublicClassifieds()};
window.resetV42FeedFilters=function(){V42.q='';V42.kind='all';V42.city='';V42.maxPrice='';renderPublicClassifieds()};
window.openV42ClassifiedContact=function(id){const a=V42.feed.find(x=>x._source==='classified'&&x.id===id);if(!a)return say('Annonce introuvable.');if(!S.session)return authModal('account');if(a.is_mine)return go('account');openModal(`<h2>💬 Contacter l’annonceur</h2><p><b>${e(a.title)}</b></p><div class="notice">Votre message passe par Issoire Connect. Aucune adresse personnelle n’est affichée.</div><label>Message</label><textarea id="v42ClassifiedMessage" rows="5" maxlength="2000" placeholder="Bonjour, votre annonce est-elle toujours disponible ?"></textarea><button class="btn brand" onclick="sendV42ClassifiedContact('${e(id)}')">Envoyer le message</button>`)};
window.sendV42ClassifiedContact=async function(id){if(!S.session)return authModal('account');const body=document.getElementById('v42ClassifiedMessage')?.value.trim();if(!body)return say('Écrivez un message avant l’envoi.');const {error}=await sb.rpc('ic_send_message',{p_body:body,p_business_id:null,p_classified_id:id});if(error)return say(error.message);closeModal();say('Message envoyé à l’annonceur.')};

// ---------------------------------------------------------------------------
// 3) ADMIN : l’onglet Utilisateurs affiche enfin les comptes Auth réels,
//    donc email + nom + rôle + dates. Aucun mot de passe n’est lu ni affiché.
// ---------------------------------------------------------------------------
const baseAdminLoadTab=window.adminLoadTab;
window.adminLoadTab=async function(tab,q='',keepShell=false){
 if(tab!=='profiles'||typeof baseAdminLoadTab!=='function')return typeof baseAdminLoadTab==='function'?baseAdminLoadTab(tab,q,keepShell):null;
 await baseAdminLoadTab(tab,'',keepShell);
 return renderV42AdminUsers(q);
};
async function renderV42AdminUsers(q=''){
 if(!isAdmin())return say('Accès administrateur requis.');
 const host=document.getElementById('adminList');if(!host)return;
 host.innerHTML='<div class="empty">Chargement des comptes réels…</div>';
 const input=document.getElementById('adminSearch');if(input){input.placeholder='Rechercher par email, nom ou ville';input.value=q||''}
 const {data,error}=await sb.rpc('ic_admin_user_directory',{p_search:q||null,p_limit:150});
 if(error){host.innerHTML=`<div class="notice">${e(error.message)}</div>`;return}
 V42.adminUsers=data||[];
 host.innerHTML=`<div class="sectionhead"><div><h2>👤 Utilisateurs inscrits</h2><p>${V42.adminUsers.length} compte(s) affiché(s). Les comptes sont lus depuis l’authentification réelle, pas seulement depuis le nom du profil.</p></div></div>${V42.adminUsers.length?`<div class="cards">${V42.adminUsers.map(u=>`<article class="card"><div class="row between"><div><span class="pill">${e(u.role||'resident')}</span><h3 style="margin:7px 0 2px">${e(u.display_name||u.email||'Utilisateur')}</h3></div>${S.session?.user?.id===u.id?'<span class="pill">TON COMPTE</span>':''}</div><div class="muted">✉️ ${e(u.email||'Email indisponible')}<br>📍 ${e(u.city||'Issoire')} ${e(u.postal_code||'')} · rayon ${Number(u.radius_km||10)} km<br>🗓 Inscrit le ${fmtDateTime(u.created_at)}${u.last_sign_in_at?`<br>Dernière connexion : ${fmtDateTime(u.last_sign_in_at)}`:''}</div><div class="actions"><button class="btn brand" onclick="openV42AdminUser('${e(u.id)}')">✏️ Modifier le profil</button></div></article>`).join('')}</div>`:'<div class="empty">Aucun compte ne correspond à la recherche.</div>'}`;
}
window.openV42AdminUser=function(id){if(!isAdmin())return;const u=V42.adminUsers.find(x=>x.id===id);if(!u)return say('Utilisateur introuvable.');const self=S.session?.user?.id===u.id;openModal(`<h2>👤 Modifier le profil utilisateur</h2><div class="notice"><b>${e(u.email||'')}</b><br>L’email de connexion est affiché en lecture seule. Aucun mot de passe n’est accessible ici.</div><div class="form"><label>Nom affiché</label><input id="v42auName" value="${e(u.display_name||'')}"><label>Rôle</label><select id="v42auRole" ${self?'disabled':''}><option value="resident" ${u.role==='resident'?'selected':''}>Habitant</option><option value="pro" ${u.role==='pro'?'selected':''}>Professionnel</option><option value="admin" ${u.role==='admin'?'selected':''}>Administrateur</option></select>${self?'<small class="muted">Ton propre rôle administrateur est verrouillé ici.</small>':''}<div class="two"><div><label>Ville</label><input id="v42auCity" value="${e(u.city||'Issoire')}"></div><div><label>Code postal</label><input id="v42auPostal" value="${e(u.postal_code||'63500')}"></div></div><label>Rayon</label><select id="v42auRadius">${RADII.map(r=>`<option value="${r}" ${Number(u.radius_km||10)===r?'selected':''}>${r} km</option>`).join('')}</select><button class="btn brand" onclick="saveV42AdminUser('${e(id)}')">💾 Enregistrer</button></div>`)};
window.saveV42AdminUser=async function(id){if(!isAdmin())return;const u=V42.adminUsers.find(x=>x.id===id);if(!u)return;const payload={display_name:document.getElementById('v42auName')?.value.trim()||null,city:document.getElementById('v42auCity')?.value.trim()||'Issoire',postal_code:document.getElementById('v42auPostal')?.value.trim()||'63500',radius_km:Number(document.getElementById('v42auRadius')?.value||10),updated_at:new Date().toISOString()};if(S.session?.user?.id!==id)payload.role=document.getElementById('v42auRole')?.value||'resident';const {error}=await sb.from('ic_profiles').update(payload).eq('id',id);if(error)return say(error.message);closeModal();say('Profil utilisateur mis à jour.');const q=document.getElementById('adminSearch')?.value||'';await renderV42AdminUsers(q)};

// ---------------------------------------------------------------------------
// 4) ESPACE PRO : un tableau de bord canonique, sans empilement de panneaux.
//    Chaque bouton ouvre une fonction réelle et unique.
// ---------------------------------------------------------------------------
const STATUS={to_qualify:'À qualifier',contacted:'Contacté',meeting:'Rendez-vous',proposal:'Proposition',won:'Gagné',lost:'Perdu'};
function proTool(icon,title,desc,onclick,locked=false){return `<article class="card"><div class="row"><div class="avatar">${icon}</div><div><h3>${e(title)}</h3><div class="muted">${e(desc)}</div></div></div><div class="actions"><button class="btn ${locked?'':'brand'}" onclick="${onclick}">${locked?'🔒 Pro 360':'Ouvrir'}</button></div></article>`}
window.proAccount=function(){
 if(!S.session)return authModal('account');
 const b=business();
 if(!b){main.innerHTML=`<div class="sectionhead"><div><span class="pill">🏪 ESPACE PRO</span><h2>Créer ou retrouver mon établissement</h2><p>Votre compte habitant reste le même. L’espace Pro s’ajoute dessus.</p></div><button class="btn" onclick="go('home')">Accueil habitant</button></div><div class="cards"><article class="card"><h3>🔎 Mon entreprise existe déjà</h3><p>Recherchez-la dans l’annuaire puis revendiquez sa fiche.</p><button class="btn brand" onclick="go('businesses')">Rechercher mon entreprise</button></article><article class="card"><h3>➕ Créer une nouvelle fiche</h3><p>Pour un nouvel établissement ou une activité mobile.</p><button class="btn brand" onclick="openIcCompanyProfile()">Créer ma fiche</button></article></div><div class="sectionhead"><div><h2>Abonnements Pro</h2></div></div>${typeof pricingHtml==='function'?pricingHtml(true,'free'):''}`;return;
 }
 const full=has360(),plan=full?'Pro 360':String(b.plan||'')==='essential'?'Pro Local':'Professionnel';
 const tools=[
  ['🎯','Radar Prospects','Trouver les besoins confirmés et les cibles compatibles',`openIcProspectRadarV40()`,!full],
  ['👥','Mes prospects','Consulter les prospects enregistrés par le Radar',`openV42Prospects()`,!full],
  ['📌','Suivi commercial / pipeline','Faire avancer chaque prospect jusqu’à gagné ou perdu',`openV42Pipeline()`,!full],
  ['📡','Opportunités Pro','Répondre aux besoins réellement publiés par les habitants',`openIcLocalNeeds('${e(b.id)}')`,!full],
  ['◎','Ma clientèle cible','Définir métier, ville et rayon du Radar Prospects',`openV42Targeting()`,!full],
  ['🛍️','Mes produits/services','Publier et consulter vos prestations et produits',`openV42Products()` ,false],
  ['🎁','Mes avantages','Créer les Avantages IC réservés aux membres',`openV42Benefits()`,false],
  ['💼','Recruter','Publier et consulter vos offres d’emploi',`openV42Recruiting()`,false],
  ['📣','Mes campagnes','Créer et suivre vos campagnes locales',`openV42Campaigns()`,!full],
  ['🏪','Mon établissement','Modifier la fiche, la zone, les horaires et les coordonnées',`openIcCompanyProfile('${e(b.id)}')`,false]
 ];
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">TABLEAU DE BORD PRO</span><h2 style="margin-top:8px">${e(b.name)}</h2><p>${e(plan)} · ${e(b.city||'Issoire')} · votre compte conserve aussi tous les services habitants.</p></div><div class="actions"><button class="btn" onclick="go('home')">🏠 Services habitants</button><button class="btn" onclick="openIcPlans()">💳 Abonnement</button><button class="btn" onclick="logout()">Déconnexion</button></div></div><div class="notice"><b>${full?'⭐ Pro 360 — tout inclus':'🏪 Pro Local — être trouvé'}</b><br>${full?'Radar Prospects, CRM, pipeline, opportunités et campagnes sont actifs.':'Les outils de prospection marqués Pro 360 nécessitent l’offre 19,99 €/mois.'}</div><div class="sectionhead"><div><h2>Outils professionnels</h2><p>Une seule entrée par fonction, dans l’ordre du parcours commercial.</p></div></div><div class="cards">${tools.map(t=>proTool(...t)).join('')}</div>`;
};

window.openV42Prospects=async function(){if(!require360('Mes prospects'))return;await loadV42Pipeline();renderV42Pipeline(false)};
window.openV42Pipeline=async function(){if(!require360('Suivi commercial / pipeline'))return;await loadV42Pipeline();renderV42Pipeline(true)};
async function loadV42Pipeline(){const {data,error}=await sb.from('sd_prospect_pipeline').select('*').eq('user_id',S.session.user.id).order('updated_at',{ascending:false}).limit(250);if(error){say(error.message);V42.pipeline=[];return}V42.pipeline=data||[]}
function renderV42Pipeline(showStages){
 const rows=V42.pipeline;
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">⭐ PRO 360</span><h2>${showStages?'📌 Suivi commercial / pipeline':'👥 Mes prospects'}</h2><p>${rows.length} prospect(s) enregistré(s).</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="openIcProspectRadarV40()">🎯 Radar Prospects</button></div></div>${rows.length?`<div class="cards">${rows.map(r=>`<article class="card"><div class="row between"><span class="pill">${e(STATUS[r.status]||r.status||'À qualifier')}</span><span class="pill">${Number(r.score||0)} %</span></div><h3>${e(r.company||r.title||'Prospect')}</h3><div class="muted">${e(r.title||'')}${r.city?' · '+e(r.city):''}${r.distance_km!=null?' · '+Number(r.distance_km).toFixed(1)+' km':''}</div>${r.notes?`<p>${e(r.notes)}</p>`:''}<div class="actions">${showStages?`<select id="v42status_${e(r.id)}" onchange="setV42ProspectStatus('${e(r.id)}',this.value)">${Object.entries(STATUS).map(([v,l])=>`<option value="${v}" ${r.status===v?'selected':''}>${e(l)}</option>`).join('')}</select>`:''}<button class="btn" onclick="editV42Prospect('${e(r.id)}')">📝 Notes / contact</button></div></article>`).join('')}</div>`:'<div class="empty">Aucun prospect enregistré. Lancez le Radar Prospects puis utilisez « Ajouter aux prospects ».</div>'}`;
}
window.setV42ProspectStatus=async function(id,status){if(!require360('Pipeline'))return;if(!STATUS[status])return say('Statut invalide.');const {error}=await sb.from('sd_prospect_pipeline').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);const r=V42.pipeline.find(x=>x.id===id);if(r)r.status=status;say('Étape commerciale mise à jour.')};
window.editV42Prospect=function(id){const r=V42.pipeline.find(x=>x.id===id);if(!r)return;openModal(`<h2>👥 ${e(r.company||r.title||'Prospect')}</h2><div class="form"><label>Contact</label><input id="v42pName" value="${e(r.contact_name||'')}" placeholder="Nom du contact"><label>Email</label><input id="v42pEmail" type="email" value="${e(r.contact_email||'')}"><label>Téléphone</label><input id="v42pPhone" value="${e(r.contact_phone||'')}"><label>Notes</label><textarea id="v42pNotes" rows="5">${e(r.notes||'')}</textarea><button class="btn brand" onclick="saveV42Prospect('${e(id)}')">💾 Enregistrer</button></div>`)};
window.saveV42Prospect=async function(id){const payload={contact_name:document.getElementById('v42pName')?.value.trim()||null,contact_email:document.getElementById('v42pEmail')?.value.trim()||null,contact_phone:document.getElementById('v42pPhone')?.value.trim()||null,notes:document.getElementById('v42pNotes')?.value.trim()||null,updated_at:new Date().toISOString()};const {error}=await sb.from('sd_prospect_pipeline').update(payload).eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);Object.assign(V42.pipeline.find(x=>x.id===id)||{},payload);closeModal();say('Prospect mis à jour.')};

window.openV42Targeting=async function(){if(!require360('Ma clientèle cible'))return;const b=business(),{data}=await sb.from('ic_prospect_preferences').select('*').eq('user_id',S.session.user.id).maybeSingle();const p=data||{};openModal(`<h2>◎ Ma clientèle cible</h2><p class="muted">Ces réglages deviennent les valeurs par défaut du Radar Prospects.</p><div class="form"><label>Métier / activité recherchée</label><input id="v42targetProfession" value="${e(p.profession||b?.category||'')}"><div class="two"><div><label>Ville</label><input id="v42targetCity" value="${e(p.city||b?.city||S.profile?.city||'Issoire')}"></div><div><label>Code postal</label><input id="v42targetPostal" value="${e(p.postal_code||b?.postal_code||S.profile?.postal_code||'63500')}"></div></div><label>Rayon</label><select id="v42targetRadius">${RADII.map(r=>`<option value="${r}" ${Number(p.radius_km||b?.visibility_radius_km||20)===r?'selected':''}>${r} km</option>`).join('')}</select><button class="btn brand" onclick="saveV42Targeting()">💾 Enregistrer ma cible</button></div>`)};
window.saveV42Targeting=async function(){const payload={user_id:S.session.user.id,profession:document.getElementById('v42targetProfession')?.value.trim()||null,city:document.getElementById('v42targetCity')?.value.trim()||'Issoire',postal_code:document.getElementById('v42targetPostal')?.value.trim()||null,radius_km:Number(document.getElementById('v42targetRadius')?.value||20),updated_at:new Date().toISOString()};if(!RADII.includes(payload.radius_km))return say('Rayon invalide.');const {error}=await sb.from('ic_prospect_preferences').upsert(payload,{onConflict:'user_id'});if(error)return say(error.message);closeModal();say('Clientèle cible enregistrée.')};

window.openV42Products=function(){const b=business();if(!b)return;const rows=(S.products||[]).filter(x=>x.business_id===b.id);main.innerHTML=`<div class="sectionhead"><div><h2>🛍️ Mes produits/services</h2><p>${rows.length} élément(s) publié(s).</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="newProduct('${e(b.id)}')">➕ Produit/service</button><button class="btn" onclick="openIcServiceV40('${e(b.id)}')">➕ Prestation détaillée</button></div></div>${rows.length?`<div class="cards">${rows.map(p=>`<article class="card"><div class="row between"><span class="pill">${e(p.kind||'service')}</span><span class="pill">${p.is_active!==false?'🟢 Actif':'⚪ Pause'}</span></div><h3>${e(p.name)}</h3><p>${e(p.description||'')}</p><strong>${p.price!=null?euro(p.price):e(p.price_label||'Sur devis')}</strong>${p.kind==='service'?`<div class="actions"><button class="btn brand" onclick="openIcServiceV40('${e(b.id)}','${e(p.id)}')">✏️ Modifier</button></div>`:''}</article>`).join('')}</div>`:'<div class="empty">Aucun produit ou service publié.</div>'}`};
window.openV42Benefits=function(){const b=business();if(!b)return;const rows=(S.offers||[]).filter(o=>o.business_id===b.id&&o.member_only===true);main.innerHTML=`<div class="sectionhead"><div><h2>🎁 Mes avantages</h2><p>${rows.length} Avantage(s) IC créé(s).</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="openIcMemberBenefit('${e(b.id)}')">➕ Créer un avantage</button></div></div>${rows.length?`<div class="cards">${rows.map(o=>`<article class="card"><span class="pill">${o.is_active!==false?'🟢 Actif':'⚪ Inactif'}</span><h3>${e(o.title)}</h3><p>${e(o.description||'')}</p><div class="muted">${e(o.price_label||o.benefit_text||'Avantage membre')}</div></article>`).join('')}</div>`:'<div class="empty">Aucun avantage créé.</div>'}`};
window.openV42Recruiting=function(){const b=business();if(!b)return;const rows=(S.jobs||[]).filter(j=>j.business_id===b.id);main.innerHTML=`<div class="sectionhead"><div><h2>💼 Recruter</h2><p>${rows.length} offre(s) d’emploi publiée(s).</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="newJob('${e(b.id)}')">➕ Publier une offre</button></div></div>${rows.length?`<div class="cards">${rows.map(j=>`<article class="card"><div class="row between"><span class="pill">${e(j.contract_type||'Emploi')}</span><span class="pill">${j.is_active!==false?'🟢 Active':'⚪ Inactive'}</span></div><h3>${e(j.title)}</h3><p>${e(j.description||'')}</p><div class="muted">📍 ${e(j.location||b.city||'Issoire')}</div></article>`).join('')}</div>`:'<div class="empty">Aucune offre d’emploi publiée.</div>'}`};
window.openV42Campaigns=function(){if(!require360('Mes campagnes'))return;const b=business();if(!b)return;main.innerHTML=`<div class="sectionhead"><div><span class="pill">⭐ PRO 360</span><h2>📣 Mes campagnes</h2><p>Créez et mesurez vos campagnes locales.</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="newAd('${e(b.id)}')">➕ Créer une campagne</button><button class="btn" onclick="openIcAdStats('${e(b.id)}')">📊 Statistiques</button></div></div><div class="notice">Les campagnes sont réservées à Pro 360. Les statistiques d’impressions et de clics sont accessibles depuis le bouton ci-dessus.</div>`};

// ---------------------------------------------------------------------------
// 5) Nettoyage ciblé des panneaux hérités qui répètent une fonction désormais
//    présente dans le tableau de bord ou dans Annonces & besoins.
// ---------------------------------------------------------------------------
const LEGACY_IDS=['icNeedHome','icV40RadarPanel','icMemberBenefitsPanel','icAdTools','icMobileProV40','icPlanPanel','icPlanUsage','icNeedProPanel','icAdminPlansProfile'];
function cleanLegacyPanels(root=document){for(const id of LEGACY_IDS)root.querySelector?.('#'+id)?.remove()}
const observer=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)cleanLegacyPanels(n);cleanLegacyPanels(document)});
observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>cleanLegacyPanels(document),0);

// Rebrancher explicitement la route Annonces sur le rendu unifié si un ancien
// wrapper de go l’a déjà créée avant ce correctif.
const baseGo=window.go;
if(typeof baseGo==='function')window.go=function(page,...args){const r=baseGo.call(this,page,...args);if(page==='classifieds')setTimeout(()=>window.renderPublicClassifieds(),80);if(page==='home')setTimeout(refreshPublicCounters,80);return r};

window.icV42={version:'42.0',loadUnifiedFeed,refreshPublicCounters,renderAdminUsers:renderV42AdminUsers,cleanLegacyPanels};
})();
