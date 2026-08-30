(()=>{
  const style=document.createElement('style');
  style.textContent=`
  .sd-priority-row{display:flex;gap:8px;flex-wrap:wrap;margin:9px 0}.sd-priority{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;font-size:10px;font-weight:900;border:1px solid;cursor:pointer;font-family:inherit}.sd-priority:hover{filter:brightness(1.12)}.sd-priority:focus-visible{outline:2px solid #68d5ff;outline-offset:2px}.sd-hot{background:#321a1d;border-color:#7b343b;color:#ffb7bd}.sd-warm{background:#332817;border-color:#765c2c;color:#ffe19a}.sd-cool{background:#15263d;border-color:#33597d;color:#b9ddff}.sd-chevron{font-size:9px;opacity:.8}.sd-priority-details{display:none;margin:8px 0 10px}.sd-priority-details.open{display:block}.sd-insight{margin:7px 0;padding:10px 11px;border-radius:10px;border:1px solid #314765;background:#0c172b;font-size:10px;line-height:1.55;color:#cbd8ed}.sd-insight b{color:#9fe3ff}.sd-provider{border-color:#3d4b72;background:#15172b;color:#ded9ff}.sd-provider b{color:#c9c1ff}.sd-action{border-color:#285747;background:#0d2822;color:#c6efd9}.sd-action b{color:#5be39d}
  `;
  document.head.appendChild(style);

  function esc(v){try{return escapeHtml(String(v??''))}catch(e){return String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]))}}
  function daysUntil(v){if(!v)return null;const d=new Date(v);if(Number.isNaN(d.getTime()))return null;return Math.ceil((d.getTime()-Date.now())/86400000)}
  function ageDays(v){if(!v)return null;const d=new Date(v);if(Number.isNaN(d.getTime()))return null;return Math.max(0,Math.floor((Date.now()-d.getTime())/86400000))}

  function classify(o){
    const score=Number(o?.score||0),left=daysUntil(o?.deadline),age=ageDays(o?.published_at);
    if((left!==null&&left>=0&&left<=21&&score>=88)||(age!==null&&age<=7&&score>=95))return{cls:'sd-hot',label:'🔥 Prioritaire',level:'hot'};
    if((left!==null&&left>=0&&left<=45)||score>=82)return{cls:'sd-warm',label:'🟠 À traiter',level:'warm'};
    return{cls:'sd-cool',label:'🔵 À surveiller',level:'cool'};
  }

  function whyNow(o){
    const score=Number(o?.score||0),left=daysUntil(o?.deadline),age=ageDays(o?.published_at);
    if(left!==null&&left>=0){
      if(left<=7)return `Échéance dans ${left} jour${left>1?'s':''} : fenêtre de réponse très courte. Score ${score}/100.`;
      if(left<=21)return `Échéance dans ${left} jours et score ${score}/100 : qualification commerciale à lancer rapidement.`;
      if(left<=45)return `Échéance dans ${left} jours : temps encore disponible pour qualifier le besoin et préparer une approche. Score ${score}/100.`;
      return `Marché actif avec une échéance dans ${left} jours. Score ${score}/100 : à intégrer au pipeline dès maintenant.`;
    }
    if(age!==null&&age<=7)return `Signal publié récemment (${age===0?'aujourd’hui':`il y a ${age} jour${age>1?'s':''}`}) avec un score de ${score}/100. Échéance non publiée : à qualifier rapidement.`;
    return `Score ${score}/100. Échéance non publiée dans les données disponibles : opportunité à qualifier avant d’engager une prospection.`;
  }

  function idealProvider(o){
    const t=` ${o?.title||''} ${o?.signal||''} ${o?.probable_need||''} ${o?.sector||''} `.toLowerCase();
    if(/cyber|sécur|security|vulnérab/.test(t))return 'ESN cybersécurité, MSSP ou intégrateur sécurité.';
    if(/cloud|hébergement|hosting|infogérance|infogerance|datacenter|data center/.test(t))return 'MSP, intégrateur cloud ou société d’infogérance.';
    if(/erp|sap|crm|sirh|ressources humaines/.test(t))return 'Éditeur ou intégrateur ERP/CRM/SIRH, ou ESN applicative.';
    if(/intelligence artificielle|artificial intelligence|\bia\b|data|bi|analytics|database|base de données/.test(t))return 'Cabinet Data/IA, ESN data ou éditeur spécialisé.';
    if(/réseau|reseau|télécom|telecom|fibre|wifi|wi-fi|thd/.test(t))return 'Intégrateur réseaux/télécoms ou opérateur B2B.';
    if(/serveur|stockage|ordinateur|matériel informatique|materiel informatique|poste de travail|infrastructure/.test(t))return 'Revendeur-intégrateur IT, spécialiste infrastructure ou maintenance.';
    if(/audiovisuel|affichage numérique|affichage numerique|interactive/.test(t))return 'Intégrateur audiovisuel et solutions numériques.';
    return 'ESN, éditeur logiciel ou intégrateur numérique adapté au besoin.';
  }

  function recommendedAction(o,level){
    if(o?.locked)return 'Débloquer l’acheteur, l’objet exact, la source et l’échéance avant de prospecter.';
    if(level==='hot')return 'Ouvrir la source, vérifier les conditions et ajouter immédiatement l’affaire au pipeline.';
    if(level==='warm')return 'Qualifier l’acheteur et le besoin, puis préparer une prise de contact ou un partenaire adapté.';
    return 'Conserver l’affaire en surveillance et la requalifier lors de la prochaine mise à jour du radar.';
  }

  function findOpp(card){
    const id=(card.id||'').replace(/^card-/,'');
    try{return Array.isArray(feed)?feed.find(x=>String(x.id)===id):null}catch(e){return null}
  }

  function decorate(){
    document.querySelectorAll('#feed .card').forEach(card=>{
      const o=findOpp(card);if(!o)return;
      const key=String(o.id)+'|'+String(o.score)+'|'+String(o.deadline||'')+'|'+String(o.published_at||'')+'|'+String(o.locked||'');
      if(card.dataset.sdPriorityKey===key)return;
      card.dataset.sdPriorityKey=key;
      card.querySelectorAll('.sd-priority-row,.sd-priority-details').forEach(x=>x.remove());

      const p=classify(o);
      const row=document.createElement('div');row.className='sd-priority-row';
      const btn=document.createElement('button');
      btn.type='button';btn.className='sd-priority '+p.cls;btn.setAttribute('aria-expanded','false');
      btn.innerHTML=p.label+' <span class="sd-chevron">▼</span>';
      row.appendChild(btn);

      const details=document.createElement('div');details.className='sd-priority-details';
      details.innerHTML=
        '<div class="sd-insight"><b>Pourquoi agir maintenant ?</b><br>'+esc(whyNow(o))+'</div>'+
        '<div class="sd-insight sd-provider"><b>Prestataire idéal</b><br>'+esc(idealProvider(o))+'</div>'+
        '<div class="sd-insight sd-action"><b>Action recommandée</b><br>'+esc(recommendedAction(o,p.level))+'</div>';

      btn.addEventListener('click',()=>{
        const open=details.classList.toggle('open');
        btn.setAttribute('aria-expanded',open?'true':'false');
        const c=btn.querySelector('.sd-chevron');if(c)c.textContent=open?'▲':'▼';
      });

      const anchor=card.querySelector('.tagrow')||card.querySelector('.signal')||card.firstElementChild;
      anchor?.insertAdjacentElement('afterend',row);
      row.insertAdjacentElement('afterend',details);
    });
  }

  const obs=new MutationObserver(decorate);obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  setInterval(decorate,1000);setTimeout(decorate,250);
})();