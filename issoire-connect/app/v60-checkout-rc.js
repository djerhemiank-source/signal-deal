(function(){
  'use strict';
  const V60_BUILD='2026-09-05-v60.0';
  const V60_PLANS={
    essential:{name:'Essentiel',price:'4,99 €',radius:5,items:['Fiche enrichie','20 produits/services','2 promotions / mois','Zone de visibilité 5 km']},
    pro:{name:'Pro',price:'9,99 €',radius:20,items:['Produits et offres illimités','Commandes et devis','Emploi & événements','Outils commerciaux Pro','Zone de visibilité 20 km']},
    proplus:{name:'Pro+',price:'19,99 €',radius:50,items:['Tout Pro','Campagnes sponsorisées','Ciblage habitants & professionnels','Visibilité renforcée','Zone de visibilité 50 km']}
  };
  if(typeof S==='undefined') return;

  const css=document.createElement('style');
  css.textContent=`
  .v60-test-banner{display:flex;gap:12px;align-items:flex-start;background:#eef7ff;border:1px solid #bddcff;border-left:5px solid #2563eb;border-radius:16px;padding:14px 16px;margin:12px 0}.v60-test-banner b{color:#123d73}.v60-badge{display:inline-block;padding:5px 9px;border-radius:999px;background:#123d73;color:#fff;font-size:11px;font-weight:900;letter-spacing:.04em}.v60-safe{font-size:12px;color:#526171}.v60-checkout-loading{opacity:.65;pointer-events:none}.v60-success{border-left:5px solid #16a34a}.v60-cancel{border-left:5px solid #f59e0b}
  `;
  document.head.appendChild(css);

  function planState(){
    const b=S.v59?.billing||{};
    const active=['active','trialing','past_due'].includes(String(b.status||''));
    return {paid:!!b.paid&&active,plan:String(b.plan||'free').toLowerCase(),livemode:!!b.livemode,status:String(b.status||'active')};
  }

  const baseProPlan=proPlan;
  proPlan=function(){
    if(typeof salesIsRep==='function'&&salesIsRep()) return 'team';
    const st=planState();
    if(S.session){
      if(st.paid&&V60_PLANS[st.plan]) return st.plan;
      const bp=String(S.myBusinesses?.[0]?.plan||'free').toLowerCase();
      return V60_PLANS[bp]?bp:'free';
    }
    return baseProPlan();
  };
  proSubscribed=function(){return !!(typeof salesIsRep==='function'&&salesIsRep())||['essential','pro','proplus'].includes(String(proPlan()).toLowerCase())};

  pricingHtml=function(){
    const current=proPlan(),st=planState();
    return `<div class="v60-test-banner"><span class="v60-badge">STRIPE TEST</span><div><b>V.60 Release Candidate · aucun débit réel</b><div class="v60-safe">Les boutons ci-dessous ouvrent le Checkout Stripe de l’environnement de test. N’utilisez pas de vraie carte bancaire pendant cette phase.</div></div></div><div class="plan-grid">${Object.entries(V60_PLANS).map(([id,p])=>{
      const isCurrent=current===id&&st.paid;
      const label=isCurrent?'Formule actuelle':(st.paid?'Gérer via Stripe':`Choisir ${p.name} · TEST`);
      const action=st.paid?`manageIcBillingV59()`:`choosePlan('${id}')`;
      return `<article class="plan ${id==='pro'?'pop':''}">${isCurrent?'<span class="pill green plan-current">Formule actuelle</span>':''}<span class="pill ${st.paid?'green':'orange'}">${st.paid?'ABONNEMENT':'MODE TEST'}</span><h3>${p.name}</h3><div class="amount">${p.price}<small> / mois</small></div><p class="muted">Zone de visibilité jusqu’à <b>${p.radius} km</b>.</p><ul>${p.items.map(x=>`<li>${x}</li>`).join('')}</ul><button class="btn ${id==='pro'?'primary':'blue'}" onclick="${action}">${label}</button></article>`
    }).join('')}</div>`;
  };

  window.choosePlan=function(id){
    id=String(id||'').toLowerCase();
    if(!V60_PLANS[id]) return say('Formule inconnue');
    if(!S.session){say('Connectez-vous pour tester l’abonnement');S.page='account';render();return}
    const st=planState();
    if(st.paid) return manageIcBillingV59();
    const p=V60_PLANS[id];
    openModal(`<h2>Checkout Stripe TEST · ${p.name}</h2><div class="v60-test-banner"><span class="v60-badge">TEST</span><div><b>${p.price} / mois · aucun débit réel</b><div class="v60-safe">Vous allez quitter Issoire Connect vers la page Stripe de test. Utilisez uniquement une carte de test Stripe.</div></div></div><p>Après le paiement TEST, le webhook Stripe mettra à jour automatiquement votre formule dans Supabase.</p><div class="v59-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="startSubscriptionCheckoutV60('${id}',this)">Continuer vers Stripe TEST</button></div>`);
  };

  window.startSubscriptionCheckoutV60=async function(plan,btn){
    if(!sb||!S.session)return say('Connectez-vous d’abord');
    if(!V60_PLANS[plan])return say('Formule inconnue');
    try{
      if(btn){btn.classList.add('v60-checkout-loading');btn.disabled=true;btn.textContent='Création du Checkout…'}
      const requestId=globalThis.crypto?.randomUUID?.();if(!requestId)throw new Error('Navigateur trop ancien pour sécuriser le Checkout');
      const {data,error}=await sb.functions.invoke('ic-subscription-checkout',{body:{plan,request_id:requestId}});
      if(error)throw error;
      if(data?.error==='existing_paid_subscription'){closeModal();say('Un abonnement existe déjà : ouverture du portail Stripe');return manageIcBillingV59()}
      if(!data?.ok||!data?.url)throw new Error(data?.detail||data?.error||'Checkout indisponible');
      if(data?.livemode!==false)throw new Error('Sécurité V.60 : session LIVE refusée');
      location.href=data.url;
    }catch(e){
      if(btn){btn.classList.remove('v60-checkout-loading');btn.disabled=false;btn.textContent='Continuer vers Stripe TEST'}
      say('Checkout TEST impossible : '+(e?.message||e));
    }
  };

  window.choosePlanV59Info=function(){
    openModal(`<h2>Abonnements Issoire Connect V.60</h2><p>Le Checkout Stripe est maintenant branché en <b>mode TEST uniquement</b>.</p><div class="orange-note"><b>Sécurité :</b> aucune clé Stripe LIVE n’est utilisée par le checkout V.60. Les paiements réels restent désactivés.</div><div class="v59-actions"><button class="btn" onclick="closeModal()">Fermer</button></div>`);
  };

  const previousProProfileV60=proProfile;
  proProfile=function(){
    previousProProfileV60();
    const mini=main.querySelector('.v59-mini');
    if(mini) mini.textContent='V.60 RC : Checkout Stripe actif en environnement TEST uniquement. Aucun encaissement réel n’est activé.';
    main.insertAdjacentHTML('beforeend',`<div class="card soft"><span class="v60-badge">V.60 RC</span><h3>✅ Chaîne abonnement testée côté application</h3><p class="muted">Choix formule → Checkout Stripe TEST → webhook signé → ic_subscriptions → droits Essentiel / Pro / Pro+ → portail client.</p></div>`);
  };

  const previousInstallAppV60=installApp;
  installApp=async function(){
    if(S.installPrompt) return previousInstallAppV60();
    openModal(`<h2>Installer Issoire Connect V.60 RC</h2><p><b>Android / Chrome :</b> menu ⋮ → <b>Installer l’application</b>.</p><p><b>iPhone / Safari :</b> Partager → <b>Sur l’écran d’accueil</b>.</p><div class="orange-note">La V.60 renouvelle le cache PWA. Si une ancienne version reste affichée, rechargez le lien web avant de réinstaller le raccourci.</div>`);
  };

  async function syncAfterCheckout(){
    for(let i=0;i<5;i++){
      try{await loadPrivate()}catch{}
      const st=planState();
      if(st.paid)return st;
      await new Promise(r=>setTimeout(r,900));
    }
    return planState();
  }

  async function handleBillingReturnV60(){
    const u=new URL(location.href),mode=u.searchParams.get('billing'),plan=u.searchParams.get('plan');
    if(!mode)return;
    if(mode==='cancel'){
      openModal(`<h2>Paiement TEST annulé</h2><div class="card v60-cancel"><b>Aucune modification d’abonnement.</b><p class="muted">Vous êtes revenu de Stripe sans terminer le Checkout TEST.</p></div><button class="btn" onclick="closeModal()">Fermer</button>`);
    }else if(mode==='success'){
      openModal(`<h2>Retour de Stripe TEST</h2><div class="card v60-success"><b>Checkout terminé.</b><p class="muted">Vérification du webhook et de la formule ${esc(plan||'')}… Aucun débit réel n’a été effectué.</p></div>`);
      const st=await syncAfterCheckout();
      if(st.paid){closeModal();say(`Formule ${planLabel(st.plan)} activée en TEST`);render()}
      else{closeModal();say('Checkout terminé, synchronisation Stripe encore en cours. Actualisez dans quelques secondes.')}
    }else if(mode==='return'){
      try{await loadPrivate()}catch{}
      say('État de l’abonnement actualisé après le portail Stripe');
      render();
    }
    ['billing','plan','session_id'].forEach(k=>u.searchParams.delete(k));
    history.replaceState({},'',u.pathname+(u.searchParams.toString()?('?'+u.searchParams.toString()):'')+u.hash);
  }

  window.addEventListener('load',()=>setTimeout(handleBillingReturnV60,250));
  console.info('Issoire Connect V.60 RC Stripe TEST checkout',V60_BUILD);
})();
