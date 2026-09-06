(function(){
'use strict';
const BUILD='2026-09-06-v65-1-tests';
if(typeof S==='undefined')return;
S.v65=S.v65||{cloudTests:null};
function deviceRows(){
 const sw='serviceWorker' in navigator;
 const standalone=window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true;
 const notif='Notification' in window;
 const push='PushManager' in window;
 const geo='geolocation' in navigator;
 const clip=!!navigator.clipboard;
 const ds=typeof DecompressionStream==='function';
 return [
  ['Connexion HTTPS / contexte sécurisé',window.isSecureContext],
  ['En ligne',navigator.onLine],
  ['Service Worker supporté',sw],
  ['Mode application installée',standalone],
  ['Géolocalisation supportée',geo],
  ['Notifications supportées',notif],
  ['Push supporté',push],
  ['Presse-papiers moderne',clip],
  ['Décompression navigateur',ds]
 ];
}
function rowsHtml(rows){return rows.map(([l,v])=>`<div class="v59-row"><span>${esc(l)}</span><b>${v?'✅':'⚠️'}</b></div>`).join('')}
function accountDiagHtml(){
 const perm=('Notification' in window)?Notification.permission:'non supporté';
 return `<section class="section"><div class="card"><div class="section-head"><div><span class="v61-tag">V.65 TESTS</span><h3>🧪 Diagnostic appareil</h3><p>Contrôles sans écriture pour préparer la 1.0.</p></div></div>${rowsHtml(deviceRows())}<div class="v59-row"><span>Permission notifications</span><b>${esc(perm)}</b></div><div class="actions" style="margin-top:12px"><button class="btn" onclick="location.href='diagnostic.html?v=65.0'">Diagnostic complet</button><button class="btn" onclick="location.href='installer.html?v=65.0'">Tester l’installation</button>${S.session?'<button class="btn primary" onclick="runCloudDiagV65()">Tester le cloud</button>':''}</div><div id="v65CloudResult" class="muted" style="margin-top:10px"></div></div></section>`;
}
window.runCloudDiagV65=async function(){
 const box=document.getElementById('v65CloudResult');
 if(!sb||!S.session){if(box)box.textContent='Connexion requise.';return}
 if(box)box.textContent='Tests en cours…';
 const tests=[];
 async function t(label,fn){try{const r=await fn();if(r?.error)throw r.error;tests.push([label,true])}catch(e){tests.push([label,false,e?.message||String(e)])}}
 await t('Profil personnel',()=>sb.from('ic_profiles').select('id').limit(1));
 await t('Abonnement personnel',()=>sb.from('ic_subscriptions').select('plan,status,livemode').limit(1));
 await t('Agenda commercial / sales_tasks',()=>sb.from('ic_sales_tasks').select('id').limit(1));
 await t('Référentiel Collectivités',()=>sb.from('ic_civic_entities').select('id,partnership_status').limit(1));
 await t('Statut d’accès',()=>sb.rpc('ic_my_access_status'));
 S.v65.cloudTests=tests;
 if(box)box.innerHTML=tests.map(x=>`<div class="v59-row"><span>${esc(x[0])}</span><b>${x[1]?'✅ OK':'❌ '+esc(x[2]||'Erreur')}</b></div>`).join('');
};
window.markPasswordPolicyV65=async function(flag){
 if(!S.v59?.isAdmin||!sb)return say('Administrateur requis');
 if(flag){
  if(!confirm('Confirmez uniquement après avoir réglé Supabase Auth > Email sur une politique renforcée : longueur minimale d’au moins 10 caractères et exigences de caractères activées. Cette validation sera journalisée.'))return;
 }else if(!confirm('Marquer cette vérification comme non validée ?'))return;
 const {data,error}=await sb.rpc('ic_admin_set_security_verification',{p_key:'auth_password_policy_hardened',p_verified:!!flag});
 if(error)return say(error.message);
 say(flag?'Politique de mot de passe vérifiée':'Vérification réinitialisée');
 if(typeof loadReleaseGateV62==='function')loadReleaseGateV62();
};
const previousAccountPageV65=accountPage;
accountPage=function(){previousAccountPageV65();main.insertAdjacentHTML('beforeend',accountDiagHtml())};
const previousAdminPageV65=window.admin59Page;
if(typeof previousAdminPageV65==='function')window.admin59Page=function(){
 previousAdminPageV65();
 if(!S.v59?.isAdmin)return;
 main.insertAdjacentHTML('beforeend',`<section class="section"><div class="card"><div class="section-head"><div><span class="v61-tag">V.65 QA</span><h3>🔐 Validation sécurité de release</h3><p>Ton organisation Supabase est actuellement en plan Free. La protection des mots de passe compromis est une option Pro+, donc elle reste recommandée mais non bloquante. Le prérequis sécurité obligatoire est une politique de mot de passe renforcée dans Auth.</p></div></div><div class="actions"><a class="btn" target="_blank" rel="noopener" href="https://supabase.com/dashboard/project/eazukvtjxeirbitukueb/auth/providers?provider=Email">⚙️ Ouvrir les réglages Auth</a><button class="btn green" onclick="markPasswordPolicyV65(true)">✅ Politique renforcée configurée</button><button class="btn" onclick="markPasswordPolicyV65(false)">Réinitialiser</button><button class="btn primary" onclick="runCloudDiagV65()">🧪 Tester les accès cloud</button></div><div id="v65CloudResult" class="muted" style="margin-top:10px"></div></div></section>`);
};
console.info('Issoire Connect V.65.1 diagnostics',BUILD);
})();
