(()=>{
if(typeof window==='undefined')return;
const LOCAL='essential', FULL='proplus';
const LOCAL_LINK='https://buy.stripe.com/test_00w14ob7wajWgGb5K518c03';
const FULL_LINK='https://buy.stripe.com/test_00w7sMb7w3VygGb2xT18c05';
const isLegacyFull=p=>p==='pro'||p==='proplus';
const current=()=>{if(typeof S==='undefined')return'free';if(S.profile?.role==='admin')return'admin';return S.subscription?.plan||S.subscriptions?.plan||S.mySubscription?.plan||S.myBusinesses?.[0]?.plan||'free'};
const esc2=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
const upgrade360=feature=>{const html=`<h2>🔒 ${esc2(feature)}</h2><p>Cette fonction fait partie du moteur commercial complet d’Issoire Connect.</p><div class="notice"><b>Pro 360 — 19,99 € / mois</b><br>Radar Prospects, prospects, pipeline, opportunités, clientèle cible, campagnes et outils commerciaux : tout est inclus.</div><div class="actions"><button class="btn brand" onclick="closeModal();openIcPlans()">Voir Pro 360</button><button class="btn" onclick="closeModal()">Fermer</button></div>`;if(typeof openModal==='function')openModal(html);else if(typeof say==='function')say(`${feature} nécessite Pro 360.`)};

if(window.icPlanEntitlements){
 const P=window.icPlanEntitlements;
 if(P.essential){P.essential.label='Pro Local';P.essential.price='4,99 € / mois';P.essential.features=['Fiche professionnelle complète','Être visible dans le Radar des habitants','Publier produits et services','Créer des Avantages IC et bons plans','Publier des offres d’emploi','Messagerie clients','Présence locale professionnelle'];P.essential.blocked=['Radar Prospects','Mes prospects','Suivi commercial / pipeline','Opportunités Pro','Ma clientèle cible','Mes campagnes commerciales'];}
 if(P.proplus){P.proplus.label='Pro 360';P.proplus.price='19,99 € / mois';P.proplus.features=['TOUT est inclus','Toutes les fonctions Pro Local','Radar Prospects','Mes prospects','Suivi commercial / pipeline','Opportunités Pro','Ma clientèle cible','Mes campagnes','Recrutement et publications pro','Rayon étendu et outils commerciaux complets'];P.proplus.blocked=[];}
 if(P.pro){P.pro.label='Ancien Pro — accès Pro 360';P.pro.price='Plan historique';}
}

window.openIcPlans=function(){
 const cur=current(), localCurrent=cur===LOCAL, fullCurrent=isLegacyFull(cur);
 const card=(kind,title,price,tag,features,currentFlag)=>`<article class="card" style="border:${kind===FULL?'2px solid #f47721':'1px solid var(--line,#dce3ee)'};position:relative"><span class="pill">${tag}</span><h3 style="margin:10px 0 2px">${title}</h3><strong style="font-size:25px">${price}</strong><p class="muted" style="margin:6px 0 12px">${kind===LOCAL?'ÊTRE TROUVÉ par les habitants':'TROUVER DES CLIENTS avec tout le moteur commercial'}</p><ul style="line-height:1.7;padding-left:20px">${features.map(x=>`<li>✅ ${x}</li>`).join('')}</ul>${currentFlag?'<div class="notice"><b>✓ Votre formule actuelle</b></div>':`<button class="btn brand" onclick="startIcPlanCheckout('${kind}')">Choisir ${title}</button>`}</article>`;
 const localFeatures=['Fiche Pro et établissement','Produits & services','Avantages IC et bons plans','Offres d’emploi','Messagerie','Visibilité dans le Radar habitant'];
 const fullFeatures=['Tout Pro Local','🎯 Radar Prospects','👥 Mes prospects','📌 Pipeline commercial','📡 Opportunités Pro','◎ Ma clientèle cible','📣 Mes campagnes','Tous les outils commerciaux actuels et futurs inclus'];
 const html=`<h2>💳 Abonnements professionnels</h2><div class="notice"><b>Simple : seulement 2 formules.</b><br><b>4,99 € : être trouvé.</b> &nbsp; <b>19,99 € : trouver des clients.</b><br>Aucun forfait intermédiaire, aucune option cachée.</div><div class="cards" style="margin-top:12px">${card(LOCAL,'Pro Local','4,99 € / mois','🏪 PRIX BAS',localFeatures,localCurrent)}${card(FULL,'Pro 360','19,99 € / mois','⭐ RECOMMANDÉ · TOUT INCLUS',fullFeatures,fullCurrent)}</div><p class="muted" style="margin-top:12px">Le compte habitant reste gratuit et toutes ses fonctions restent accessibles aux professionnels.</p>`;
 if(typeof openModal==='function')openModal(html);else if(typeof main!=='undefined')main.innerHTML=html;
};

window.startIcPlanCheckout=function(plan){
 if(plan==='pro')plan=FULL;
 if(![LOCAL,FULL].includes(plan))return;
 if(typeof S!=='undefined'&&!S.session){if(typeof authModal==='function')return authModal('account');return typeof say==='function'?say('Connectez-vous pour continuer.'):null}
 if(typeof S!=='undefined'&&S.profile?.role==='admin')return typeof say==='function'?say('Le compte administrateur dispose déjà de tous les droits.'):null;
 const base=plan===LOCAL?LOCAL_LINK:FULL_LINK,u=new URL(base);if(typeof S!=='undefined'&&S.session?.user?.id)u.searchParams.set('client_reference_id',S.session.user.id);window.open(u.toString(),'_blank','noopener,noreferrer');
};

if(typeof pricingHtml==='function')window.pricingHtml=function(logged,cur){
 const full=isLegacyFull(cur);return `<div class="cards"><div class="plan"><span class="pill">PRO LOCAL</span><h3>Pro Local</h3><div class="amount">4,99 € <small>/mois</small></div><p class="muted"><b>Être trouvé.</b><br>Fiche Pro · produits/services · Avantages IC · emplois · visibilité locale.</p>${cur===LOCAL?'<span class="pill">Formule actuelle</span>':logged?'<button class="btn brand" onclick="startIcPlanCheckout(\'essential\')">Choisir Pro Local</button>':'<button class="btn brand" onclick="authModal(\'account\')">Créer un compte pro</button>'}</div><div class="plan pop"><span class="pill">⭐ TOUT INCLUS</span><h3>Pro 360</h3><div class="amount">19,99 € <small>/mois</small></div><p class="muted"><b>Trouver des clients.</b><br>Tout Pro Local + Radar Prospects · CRM · pipeline · opportunités · ciblage · campagnes.</p>${full?'<span class="pill">Formule actuelle</span>':logged?'<button class="btn brand" onclick="startIcPlanCheckout(\'proplus\')">Choisir Pro 360</button>':'<button class="btn brand" onclick="authModal(\'account\')">Créer un compte pro</button>'}</div></div>`;

// Les fonctions commerciales 360 restent réservées à Pro 360. Un ancien plan "pro" garde les droits complets pour compatibilité.
window.icHasPro360=()=>isLegacyFull(current())||current()==='admin';
window.icRequirePro360=function(feature='Cette fonction'){if(window.icHasPro360())return true;upgrade360(feature);return false};

// Recrutement et publications locales font partie de Pro Local : on contourne uniquement les anciennes limitations techniques du plan intermédiaire supprimé.
['newJob','newBusinessEvent'].forEach(name=>{const old=window[name];if(typeof old!=='function')return;window[name]=function(...args){const b=(typeof S!=='undefined'&&S.myBusinesses||[]).find(x=>x.id===args[0]);if(b?.plan===LOCAL){const saved=b.plan;b.plan=FULL;try{return old.apply(this,args)}finally{b.plan=saved}}return old.apply(this,args)}});

// Les anciennes limites de 20 produits / 2 offres ne sont plus un argument commercial : Pro Local reste simple.
['newProduct','newOffer'].forEach(name=>{const old=window[name];if(typeof old!=='function')return;window[name]=function(...args){const b=(typeof S!=='undefined'&&S.myBusinesses||[]).find(x=>x.id===args[0]);if(b?.plan===LOCAL){const saved=b.plan;b.plan=FULL;try{return old.apply(this,args)}finally{b.plan=saved}}return old.apply(this,args)}});

// Campagnes : Pro 360 uniquement.
const oldAd=window.newAd;if(typeof oldAd==='function')window.newAd=function(...args){if(!window.icHasPro360())return upgrade360('Mes campagnes');return oldAd.apply(this,args)};

setTimeout(()=>{document.querySelectorAll('*').forEach(el=>{if(el.children.length===0&&typeof el.textContent==='string'){el.textContent=el.textContent.replace(/Essential/g,'Pro Local').replace(/Pro\+/g,'Pro 360')}})},350);
})();