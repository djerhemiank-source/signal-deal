(function(){
  'use strict';
  const V61_BUILD='2026-09-05-v61.0';
  if(typeof S==='undefined') return;
  S.v61=S.v61||{access:null,suspensions:[],privacy:null,lastCheck:null};

  const style=document.createElement('style');
  style.textContent=`
    .v61-alert{border:1px solid #efb1b1;border-left:5px solid #b91c1c;background:#fff5f5;border-radius:16px;padding:14px 16px;margin:12px 0;color:#7f1d1d}
    .v61-ok{border:1px solid #b7dfc1;border-left:5px solid #15803d;background:#f3fff6;border-radius:16px;padding:14px 16px;margin:12px 0}
    .v61-admin-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0}
    .v61-tag{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:900;background:#eef2ff;color:#3730a3}
    .v61-tag.red{background:#fee2e2;color:#991b1b}.v61-tag.green{background:#dcfce7;color:#166534}
    .v61-admin-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
    .v61-admin-actions .btn{padding:6px 9px;font-size:12px}
    @media(max-width:850px){.v61-admin-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  async function loadV61Access(){
    if(!sb||!S.session){S.v61.access=null;return}
    try{
      const {data,error}=await sb.rpc('ic_my_access_status');
      if(error)throw error;
      S.v61.access=Array.isArray(data)?(data[0]||null):data;
      S.v61.lastCheck=new Date().toISOString();
    }catch(e){console.warn('V61 access status',e);S.v61.access=null}
  }

  const previousLoadPrivateV61=loadPrivate;
  loadPrivate=async function(){await previousLoadPrivateV61();await loadV61Access()};

  function accessBannerHtml(){
    const a=S.v61?.access;if(!a?.user_suspended)return '';
    const expiry=a.user_expires_at?` jusqu’au ${new Date(a.user_expires_at).toLocaleString('fr-FR')}`:'';
    return `<div class="v61-alert"><b>⛔ Compte suspendu${expiry}</b><div style="margin-top:5px">${esc(a.user_reason||'Accès temporairement limité par la modération.')}</div><small>Le compte reste consultable, mais les écritures sont bloquées côté base de données.</small></div>`;
  }

  const previousRenderV61=render;
  render=function(){previousRenderV61();const b=accessBannerHtml();if(b&&main&&!main.querySelector('.v61-alert'))main.insertAdjacentHTML('afterbegin',b);document.title='Issoire Connect V.61'};

  const previousAccountV61=accountPage;
  accountPage=function(){previousAccountV61();if(!S.session)return;const a=S.v61?.access;main.insertAdjacentHTML('beforeend',`<section class="section"><div class="card soft"><span class="v61-tag">V.61 SÉCURITÉ</span><h3>État d’accès</h3>${a?.user_suspended?`<div class="v61-alert"><b>Compte suspendu</b><p>${esc(a.user_reason||'')}</p></div>`:`<div class="v61-ok"><b>✅ Compte autorisé</b><p class="muted">Aucune suspension utilisateur active.</p></div>`}<div class="v59-row"><span>Fiches professionnelles suspendues</span><b>${Number(a?.suspended_businesses||0)}</b></div></div></section>`)};

  const previousLoadAdminStatusV61=window.loadAdmin59Status;
  window.loadAdmin59Status=async function(){if(!sb||!S.session||!S.v59?.isAdmin)return say('Accès administrateur requis');try{const {data,error}=await sb.functions.invoke('ic-v61-admin-status',{body:{}});if(error)throw error;if(data?.error)throw new Error(data.error);S.v59.adminStatus=data;const box=document.getElementById('admin59Kpis');if(box)box.innerHTML=admin59KpisHtml(data)}catch(e){if(previousLoadAdminStatusV61)return previousLoadAdminStatusV61();say('État admin V.61 indisponible : '+(e?.message||e))}};

  const previousAdminKpisV61=window.admin59KpisHtml;
  window.admin59KpisHtml=function(a){const base=previousAdminKpisV61?previousAdminKpisV61(a):'';return base+`<div class="v61-admin-grid"><div class="card"><h3>🚫 Suspensions actives</h3><div class="v59-row"><span>Utilisateurs</span><b>${Number(a?.moderation?.user_suspensions||0)}</b></div><div class="v59-row"><span>Entreprises</span><b>${Number(a?.moderation?.business_suspensions||0)}</b></div></div><div class="card"><h3>🧾 Modération à traiter</h3><div class="v59-row"><span>Signalements en attente</span><b>${Number(a?.moderation?.pending_reports||0)}</b></div><div class="v59-row"><span>Revendications en attente</span><b>${Number(a?.moderation?.pending_claims||0)}</b></div></div><div class="card"><h3>🛡️ Conservation VRP</h3><div class="v59-row"><span>Expirés éligibles</span><b>${Number(a?.privacy?.expired_vrp||0)}</b></div><div class="v59-row"><span>À échéance &lt; 90 j</span><b>${Number(a?.privacy?.expiring_90_days||0)}</b></div></div></div>`};

  function expiryFromDays(days){const n=Number(days||0);if(!Number.isFinite(n)||n<=0)return null;return new Date(Date.now()+n*86400000).toISOString()}
  window.admin61SetSuspension=async function(type,id,active,label){if(!sb||!S.v59?.isAdmin)return say('Accès administrateur requis');let reason=null,expires=null;if(active){reason=prompt(`Motif de suspension — ${label||type}`,'Modération Issoire Connect');if(!reason)return;const days=prompt('Durée en jours (laisser vide = sans date de fin)','7');expires=expiryFromDays(days)}try{const {error}=await sb.rpc('ic_admin_set_suspension',{p_target_type:type,p_target_id:id,p_active:!!active,p_reason:reason,p_expires_at:expires});if(error)throw error;say(active?'Suspension appliquée':'Suspension levée');await Promise.allSettled([loadAdmin59Status(),loadAdmin61Suspensions()]);if(document.getElementById('admin59Users'))searchAdmin59Users()}catch(e){say('Action de modération impossible : '+(e?.message||e))}};

  window.loadAdmin61Suspensions=async function(){const box=document.getElementById('admin61Suspensions');if(!box||!sb||!S.v59?.isAdmin)return;box.innerHTML='<p class="muted">Chargement…</p>';try{const {data,error}=await sb.from('ic_admin_suspensions').select('id,target_type,user_id,business_id,reason,starts_at,expires_at,created_at').eq('active',true).order('created_at',{ascending:false}).limit(100);if(error)throw error;S.v61.suspensions=data||[];box.innerHTML=S.v61.suspensions.length?S.v61.suspensions.map(r=>`<div class="v59-row"><span><span class="v61-tag red">${esc(r.target_type)}</span> <b>${esc((r.user_id||r.business_id||'').slice(0,8))}…</b><br><span class="v59-mini">${esc(r.reason||'')} · ${r.expires_at?'fin '+new Date(r.expires_at).toLocaleString('fr-FR'):'sans échéance'}</span></span><button class="btn small" onclick="admin61SetSuspension('${r.target_type}','${r.user_id||r.business_id}',false,'')">Rétablir</button></div>`).join(''):'<p class="muted">Aucune suspension active.</p>'}catch(e){box.innerHTML=`<p class="muted">Erreur : ${esc(e?.message||String(e))}</p>`}};

  window.loadAdmin61Privacy=async function(){const box=document.getElementById('admin61Privacy');if(!box||!sb||!S.v59?.isAdmin)return;try{const {data,error}=await sb.rpc('ic_admin_privacy_retention_status');if(error)throw error;const r=Array.isArray(data)?(data[0]||{}):(data||{});S.v61.privacy=r;box.innerHTML=`<div class="v59-row"><span>Prospects expirés et éligibles à suppression</span><b>${Number(r.expired_eligible||0)}</b></div><div class="v59-row"><span>Échéance dans moins de 90 jours</span><b>${Number(r.expiring_90_days||0)}</b></div><div class="v59-row"><span>Liés à un compte ou gagnés (exclus de la purge)</span><b>${Number(r.linked_or_won_exempt||0)}</b></div>`}catch(e){box.innerHTML=`<p class="muted">Erreur : ${esc(e?.message||String(e))}</p>`}};
  window.admin61ReleaseExpired=async function(){if(!sb||!S.v59?.isAdmin)return;try{const {data,error}=await sb.rpc('ic_admin_release_expired_suspensions');if(error)throw error;say(`${Number(data||0)} suspension(s) expirée(s) clôturée(s)`);await loadAdmin61Suspensions();await loadAdmin59Status()}catch(e){say('Impossible : '+(e?.message||e))}};
  window.admin61PurgeVrp=async function(){if(!sb||!S.v59?.isAdmin)return;try{const {data:count,error}=await sb.rpc('ic_admin_purge_expired_vrp',{p_apply:false});if(error)throw error;const n=Number(count||0);if(!n)return say('Aucun prospect arrivé à échéance');if(!confirm(`${n} prospect(s) arrivé(s) à échéance seront supprimés avec leurs événements associés. Continuer ?`))return;const {data:done,error:err2}=await sb.rpc('ic_admin_purge_expired_vrp',{p_apply:true});if(err2)throw err2;say(`${Number(done||0)} prospect(s) supprimé(s) selon la politique de conservation`);await loadAdmin61Privacy();await loadAdmin59Status()}catch(e){say('Purge RGPD impossible : '+(e?.message||e))}};

  const previousSearchAdminUsersV61=window.searchAdmin59Users;
  window.searchAdmin59Users=async function(){if(!sb||!S.v59?.isAdmin)return;const q=document.getElementById('admin59Search')?.value?.trim()||null,box=document.getElementById('admin59Users');if(box)box.innerHTML='<p class="muted">Recherche…</p>';try{const {data,error}=await sb.rpc('ic_admin_user_directory_v2',{p_search:q,p_limit:100});if(error)throw error;const rows=data||[],ids=rows.map(r=>r.id).filter(Boolean);let suspended=new Set();if(ids.length){const {data:sus}=await sb.from('ic_admin_suspensions').select('user_id').eq('active',true).eq('target_type','user').in('user_id',ids);suspended=new Set((sus||[]).map(x=>x.user_id))}if(!box)return;box.innerHTML=rows.length?`<table class="v59-table"><thead><tr><th>Compte</th><th>Rôle</th><th>Entreprise</th><th>Abonnement</th><th>Modération</th></tr></thead><tbody>${rows.map(r=>{const isS=suspended.has(r.id);return `<tr><td><b>${esc(r.display_name||'Sans nom')}</b><br><span class="v59-mini">${esc(r.email||'')}</span><br><span class="v59-mini">${esc(r.city||'—')}</span></td><td>${esc(r.role||'resident')}</td><td>${esc(r.business_name||'—')}</td><td>${esc(r.subscription_plan||'free')}<br><span class="v59-mini">${esc(r.subscription_status||'')}</span></td><td><div class="v61-admin-actions"><button class="btn ${isS?'blue':'danger'}" onclick="admin61SetSuspension('user','${r.id}',${isS?'false':'true'},'Compte')">${isS?'Rétablir':'Suspendre'}</button>${r.business_id?`<button class="btn" onclick="admin61SetSuspension('business','${r.business_id}',true,'Entreprise')">Suspendre fiche</button>`:''}</div></td></tr>`}).join('')}</tbody></table>`:'<p class="muted">Aucun compte trouvé.</p>'}catch(e){if(previousSearchAdminUsersV61)return previousSearchAdminUsersV61();if(box)box.innerHTML=`<p class="muted">Erreur : ${esc(e?.message||String(e))}</p>`}};

  const previousAdminPageV61=window.admin59Page;
  window.admin59Page=function(){previousAdminPageV61();if(!S.v59?.isAdmin)return;main.insertAdjacentHTML('beforeend',`<section class="section"><div class="grid g2"><div class="card"><div class="section-head"><div><h3>🚫 Suspensions V.61</h3><p>Les comptes suspendus sont bloqués en écriture côté base.</p></div><button class="btn small" onclick="admin61ReleaseExpired()">Clôturer expirées</button></div><div id="admin61Suspensions"><p class="muted">Chargement…</p></div></div><div class="card"><div class="section-head"><div><h3>🛡️ Conservation des prospects VRP</h3><p>Échéance de 3 ans calculée depuis la collecte ou la validation/consentement du prospect.</p></div></div><div id="admin61Privacy"><p class="muted">Chargement…</p></div><div class="v61-admin-actions"><button class="btn" onclick="loadAdmin61Privacy()">Actualiser</button><button class="btn danger" onclick="admin61PurgeVrp()">Purger les expirés</button></div></div></div></section>`);loadAdmin61Suspensions();loadAdmin61Privacy()};
  console.info('Issoire Connect V.61 security/admin/privacy',V61_BUILD);
})();
