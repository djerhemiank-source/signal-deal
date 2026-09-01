(()=>{
if(typeof S==='undefined')return;
const PLANS={
 essential:{label:'Essential',price:'4,99 € / mois',radius:5,features:['Fiche professionnelle complète','Jusqu’à 20 produits/services actifs','2 offres ou invendus par mois','Messagerie clients','Rayon de visibilité jusqu’à 5 km','Jusqu’à 3 annonces professionnelles actives'],blocked:['Commandes/devis/réservations en ligne','Emplois et événements professionnels','Campagnes sponsorisées','Notifications automatiques aux abonnés']},
 pro:{label:'Pro',price:'9,99 € / mois',radius:20,features:['Produits/services sans limite de forfait','Offres/promos/invendus sans limite mensuelle','Commandes, devis et réservations en ligne','Publication d’emplois et événements','Campagnes sponsorisées standard','Notifications aux abonnés : jusqu’à 6 alertes / 24 h','Rayon de visibilité jusqu’à 20 km','Jusqu’à 10 annonces professionnelles actives'],blocked:[]},
 proplus:{label:'Pro+',price:'19,99 € / mois',radius:50,features:['Toutes les fonctions Pro','Rayon de visibilité jusqu’à 50 km','Jusqu’à 30 annonces professionnelles actives','Notifications aux abonnés : jusqu’à 12 alertes / 24 h','Campagnes sponsorisées incluses'],blocked:[]}
};
const LINKS={
 essential:'https://buy.stripe.com/test_00w14ob7wajWgGb5K518c03',
 pro:'https://buy.stripe.com/test_dRm8wQ2B0cs4cpVb4p18c04',
 proplus:'https://buy.stripe.com/test_00w7sMb7w3VygGb2xT18c05'
};
function e(v){return typeof esc==='function'?esc(String(v??'')):String(v??'')}
function currentPlan(){
 if(S.profile?.role==='admin')return 'admin';
 const p=S.subscription?.plan||S.subscriptions?.plan||S.mySubscription?.plan||S.myBusinesses?.[0]?.plan||'free';
 return ['essential','pro','proplus'].includes(p)?p:'free';
}
function planCard(k,p,current){
 const isCurrent=current===k;
 return `<article class="card" style="border:${isCurrent?'2px solid #188650':'1px solid var(--line,#dce3ee)'}"><div class="row between"><div><span class="pill">${isCurrent?'✓ FORFAIT ACTUEL':'PRO'}</span><h3 style="margin:8px 0 2px">${e(p.label)}</h3><strong style="font-size:22px">${e(p.price)}</strong></div><span class="pill">📍 ${p.radius} km</span></div><ul style="line-height:1.65;padding-left:20px">${p.features.map(x=>`<li>✅ ${e(x)}</li>`).join('')}${p.blocked.map(x=>`<li class="muted">— ${e(x)}</li>`).join('')}</ul>${isCurrent?'<div class="notice"><b>Ce forfait est actif sur votre compte.</b></div>':`<button class="btn brand" onclick="startIcPlanCheckout('${k}')">Choisir ${e(p.label)}</button>`}</article>`;
}
window.openIcPlans=function(){
 const current=currentPlan();
 const html=`<h2>💳 Forfaits professionnels</h2><div class="notice"><b>MODE TEST STRIPE</b><br>Aucun paiement réel n’est encaissé pour le moment. Les droits ci-dessous correspondent aux règles actuellement testées et appliquées par la base.</div><div class="cards" style="margin-top:12px">${Object.entries(PLANS).map(([k,p])=>planCard(k,p,current)).join('')}</div><p class="muted" style="margin-top:12px">Le changement de forfait est appliqué automatiquement après confirmation Stripe via le webhook sécurisé.</p>`;
 if(typeof openModal==='function')openModal(html); else if(typeof main!=='undefined')main.innerHTML=html;
};
window.startIcPlanCheckout=function(plan){
 if(!PLANS[plan]||!LINKS[plan])return;
 if(!S.session){if(typeof authModal==='function')return authModal('account');return typeof say==='function'?say('Connectez-vous avec un compte professionnel.'):null}
 if(S.profile?.role==='admin')return typeof say==='function'?say('Le compte administrateur dispose déjà de tous les droits de test.'):null;
 if(S.profile?.role!=='pro')return typeof say==='function'?say('Utilisez un compte professionnel pour souscrire un forfait.'):null;
 const u=new URL(LINKS[plan]);u.searchParams.set('client_reference_id',S.session.user.id);
 window.open(u.toString(),'_blank','noopener,noreferrer');
};
window.icPlanEntitlements=PLANS;
if(typeof proAccount==='function'){
 const _proAccountPlans=proAccount;
 window.proAccount=function(...args){
  const r=_proAccountPlans(...args);
  setTimeout(()=>{
   if(typeof main==='undefined'||document.getElementById('icPlanPanel'))return;
   const cur=currentPlan();
   const p=PLANS[cur];
   const box=document.createElement('section');box.id='icPlanPanel';box.className='card';box.style.marginBottom='14px';
   box.innerHTML=cur==='admin'?'<div class="row between"><div><span class="pill">👑 ADMIN</span><h3 style="margin:7px 0">Tous les droits de test</h3><div class="muted">Le compte administrateur n’est pas soumis aux limites commerciales.</div></div><button class="btn brand" onclick="openIcPlans()">Voir les forfaits</button></div>':p?`<div class="row between"><div><span class="pill">FORFAIT ACTUEL</span><h3 style="margin:7px 0">${e(p.label)} · ${e(p.price)}</h3><div class="muted">Rayon maximum ${p.radius} km · droits contrôlés côté serveur.</div></div><button class="btn brand" onclick="openIcPlans()">Comparer / changer</button></div>`:'<div class="row between"><div><span class="pill">FORFAIT GRATUIT</span><h3 style="margin:7px 0">Passez à un forfait professionnel</h3><div class="muted">Activez les publications et fonctions professionnelles.</div></div><button class="btn brand" onclick="openIcPlans()">Voir les forfaits</button></div>';
   main.prepend(box);
  },0);
  return r;
 };
}
})();
