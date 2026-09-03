(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const A={users:[],current:null};
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const admin=()=>!!(S.session&&S.profile?.role==='admin');
const fmt=v=>{try{return v?new Date(v).toLocaleString('fr-FR'):'—'}catch{return'—'}};
const planLabel=p=>p==='essential'?'Pro Local':(['pro','proplus'].includes(String(p))?'Pro 360':p||'Habitant');
const statusLabel=s=>s==='active'?'Actif':s==='trialing'?'Essai':s||'—';
const isNew=v=>{const t=new Date(v).getTime();return Number.isFinite(t)&&Date.now()-t<7*86400000};

const baseAdminLoadTab=window.adminLoadTab;
window.adminLoadTab=async function(tab,q='',keepShell=false){
 if(tab!=='profiles'||typeof baseAdminLoadTab!=='function')return typeof baseAdminLoadTab==='function'?baseAdminLoadTab(tab,q,keepShell):null;
 await baseAdminLoadTab(tab,'',keepShell);
 return renderIcAdminUsersV44(q);
};

window.renderIcAdminUsersV44=async function(q=''){
 if(!admin())return typeof say==='function'?say('Accès administrateur requis.'):null;
 const host=document.getElementById('adminList');if(!host)return;
 const input=document.getElementById('adminSearch');if(input){input.placeholder='Rechercher par email, nom, ville ou entreprise';input.value=q||''}
 host.innerHTML='<div class="empty">Chargement de tous les comptes inscrits…</div>';
 const {data,error}=await sb.rpc('ic_admin_user_directory_v2',{p_search:q||null,p_limit:500});
 if(error){host.innerHTML=`<div class="notice"><b>Impossible de charger les utilisateurs.</b><br>${e(error.message)}</div>`;return}
 A.users=data||[];
 const confirmed=A.users.filter(x=>x.email_confirmed).length;
 const recent=A.users.filter(x=>isNew(x.created_at)).length;
 host.innerHTML=`<div class="sectionhead"><div><h2>👥 Utilisateurs inscrits</h2><p><b>${A.users.length}</b> compte(s) réel(s) · ${confirmed} email(s) confirmé(s) · ${recent} nouveau(x) sur 7 jours.</p></div><button class="btn" onclick="renderIcAdminUsersV44(document.getElementById('adminSearch')?.value||'')">↻ Actualiser</button></div><div class="notice"><b>Cette liste vient directement de l’authentification Supabase.</b><br>Un compte apparaît ici même si son nom ou son profil n’est pas encore complété.</div>${A.users.length?`<div class="cards">${A.users.map(userCard).join('')}</div>`:'<div class="empty">Aucun utilisateur ne correspond à la recherche.</div>'}`;
};

function userCard(u){
 const label=u.display_name||u.email||'Utilisateur';
 const role=u.role==='admin'?'Administrateur':u.role==='pro'?'Professionnel':'Habitant';
 const badges=`${isNew(u.created_at)?'<span class="pill">🆕 NOUVEAU</span>':''}<span class="pill">${u.email_confirmed?'✅ Email confirmé':'⚠️ Email non confirmé'}</span><span class="pill">${e(role)}</span>`;
 const activity=Number(u.classified_count||0)+Number(u.need_count||0)+Number(u.event_count||0)+Number(u.application_count||0);
 return `<article class="card"><div class="row between"><div>${badges}<h3 style="margin:8px 0 2px">${e(label)}</h3><div class="muted">✉️ ${e(u.email||'Email indisponible')}</div></div>${S.session?.user?.id===u.id?'<span class="pill">TON COMPTE</span>':''}</div><div class="muted" style="margin-top:8px">🗓 Inscrit : ${e(fmt(u.created_at))}<br>🟢 Dernière connexion : ${e(fmt(u.last_sign_in_at))}<br>📍 ${e(u.city||'Issoire')} ${e(u.postal_code||'')} · ${Number(u.radius_km||10)} km${u.business_name?`<br>🏪 ${e(u.business_name)}`:''}<br>💳 ${e(planLabel(u.subscription_plan))}${u.subscription_status?' · '+e(statusLabel(u.subscription_status)):''}<br>📚 Activité : ${activity} élément(s)</div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="openIcAdminUserV44('${e(u.id)}')">👁 Voir / intervenir</button></div></article>`;
}

window.openIcAdminUserV44=async function(id){
 if(!admin())return;
 const basic=A.users.find(x=>x.id===id);if(!basic)return say('Utilisateur introuvable.');
 openModal(`<h2>👤 Profil utilisateur</h2><div class="empty">Chargement des informations…</div>`);
 const {data,error}=await sb.rpc('ic_admin_user_overview',{p_user:id});
 if(error){modalBody.innerHTML=`<h2>👤 Profil utilisateur</h2><div class="notice">${e(error.message)}</div>`;return}
 A.current=data||{};const u=A.current.user||{},p=A.current.profile||{},c=A.current.counts||{},businesses=A.current.businesses||[],sub=A.current.subscription||{};
 const role=p.role||basic.role||'resident',self=S.session?.user?.id===id;
 modalBody.innerHTML=`<h2>👤 ${e(p.display_name||u.email||'Utilisateur')}</h2><div class="notice"><b>${e(u.email||'')}</b><br>${u.email_confirmed?'✅ Adresse email confirmée':'⚠️ Adresse email non confirmée'}<br>Inscription : ${e(fmt(u.created_at))}<br>Dernière connexion : ${e(fmt(u.last_sign_in_at))}</div><div class="two" style="margin-top:12px"><div class="card"><h3>📊 Activité</h3><p>📣 Annonces : <b>${Number(c.classifieds||0)}</b><br>🙋 Besoins : <b>${Number(c.needs||0)}</b><br>📅 Événements : <b>${Number(c.events||0)}</b><br>💼 Candidatures : <b>${Number(c.applications||0)}</b><br>💬 Messages liés : <b>${Number(c.messages||0)}</b></p></div><div class="card"><h3>🏪 Professionnel</h3><p>${businesses.length?businesses.map(b=>`${e(b.name||'Entreprise')} · ${e(b.city||'')} · ${e(planLabel(b.plan))}`).join('<br>'):'Aucune entreprise liée.'}</p><p><b>Abonnement :</b> ${e(planLabel(sub.plan))}${sub.status?' · '+e(statusLabel(sub.status)):''}</p>${businesses[0]?.id?`<button class="btn" onclick="closeModal();viewBusiness('${e(businesses[0].id)}')">Voir l’établissement</button>`:''}</div></div><div class="form" style="margin-top:12px"><h3>✏️ Modifier le profil</h3><label>Nom affiché</label><input id="v44Name" value="${e(p.display_name||'')}"><label>Type de compte</label>${role==='admin'?`<input value="Administrateur" disabled><small class="muted">Le rôle administrateur est protégé et ne se modifie pas depuis cette fiche.</small>`:`<select id="v44Role"><option value="resident" ${role==='resident'?'selected':''}>Habitant</option><option value="pro" ${role==='pro'?'selected':''}>Professionnel</option></select>`}<div class="two"><div><label>Ville</label><input id="v44City" value="${e(p.city||basic.city||'Issoire')}"></div><div><label>Code postal</label><input id="v44Postal" value="${e(p.postal_code||basic.postal_code||'63500')}"></div></div><label>Rayon</label><select id="v44Radius">${[1,5,10,20,50].map(r=>`<option value="${r}" ${Number(p.radius_km||basic.radius_km||10)===r?'selected':''}>${r} km</option>`).join('')}</select><div class="actions"><button class="btn brand" onclick="saveIcAdminUserV44('${e(id)}','${e(role)}')">💾 Enregistrer</button>${!u.email_confirmed?`<button class="btn" onclick="resendIcAdminConfirmationV44('${e(u.email||'')}')">📨 Renvoyer confirmation</button>`:''}<button class="btn" onclick="sendIcAdminPasswordResetV44('${e(u.email||'')}')">🔑 Envoyer réinitialisation mot de passe</button></div></div>${self?'<div class="notice">Ton propre compte administrateur reste protégé contre un changement de rôle accidentel.</div>':''}`;
};

window.saveIcAdminUserV44=async function(id,currentRole){
 if(!admin())return;
 const role=currentRole==='admin'?'admin':(document.getElementById('v44Role')?.value||'resident');
 const {error}=await sb.rpc('ic_admin_update_user_profile',{p_user:id,p_display_name:document.getElementById('v44Name')?.value.trim()||null,p_role:role,p_city:document.getElementById('v44City')?.value.trim()||'Issoire',p_postal_code:document.getElementById('v44Postal')?.value.trim()||'63500',p_radius_km:Number(document.getElementById('v44Radius')?.value||10)});
 if(error)return say(error.message);closeModal();say('Profil utilisateur mis à jour.');await renderIcAdminUsersV44(document.getElementById('adminSearch')?.value||'');
};
window.resendIcAdminConfirmationV44=async function(email){if(!admin()||!email)return;const {error}=await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:location.origin+location.pathname}});if(error)return say(error.message);say('Nouvel email de confirmation envoyé.')};
window.sendIcAdminPasswordResetV44=async function(email){if(!admin()||!email)return;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)return say(error.message);say('Email de réinitialisation envoyé à l’utilisateur.')};
window.icAdminUsersV44={version:'44.0'};
})();