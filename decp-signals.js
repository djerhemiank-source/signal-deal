(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .sd-renewal-badge{border-color:#7a5ea8!important;background:#241b3d!important;color:#e3d6ff!important;font-weight:900!important}
    .sd-renewal-note{margin:8px 0;padding:9px 10px;border:1px solid #5a497a;background:#18142b;border-radius:9px;font-size:10px;line-height:1.5;color:#d7cef0}
    .sd-renewal-note b{color:#cbbcff}
  `;
  document.head.appendChild(style);

  function isRenewal(o){return /Renouvellement DECP/i.test(String(o?.sector||''))||/^Renouvellement probable/i.test(String(o?.title||''))}
  function daysUntil(v){if(!v)return null;const d=new Date(v);if(Number.isNaN(d.getTime()))return null;return Math.ceil((d.getTime()-Date.now())/86400000)}
  function findOpp(card){const id=(card.id||'').replace(/^card-/,'');try{return Array.isArray(feed)?feed.find(x=>String(x.id)===id):null}catch(e){return null}}

  function renewalPriority(o){
    const left=daysUntil(o?.deadline);
    if(left!==null&&left<=90)return{label:'🔥 Renouvellement imminent',cls:'sd-hot'};
    if(left!==null&&left<=180)return{label:'🟠 À anticiper',cls:'sd-warm'};
    return{label:'🔵 À surveiller',cls:'sd-cool'};
  }

  function decorateCard(card,o){
    card.dataset.sdRenewal='1';

    const tags=card.querySelector('.tagrow');
    if(tags){
      const normalTags=[...tags.querySelectorAll('.tag')].filter(x=>!x.classList.contains('sd-preview')&&!x.classList.contains('sd-renewal-badge'));
      const first=normalTags[0];
      if(first&&first.textContent!=='DECP · CONTRAT ATTRIBUÉ')first.textContent='DECP · CONTRAT ATTRIBUÉ';
      if(!tags.querySelector('.sd-renewal-badge')){
        const b=document.createElement('span');b.className='tag sd-renewal-badge';b.textContent='🔁 RENOUVELLEMENT PROBABLE';tags.appendChild(b);
      }
    }

    card.querySelectorAll('.line').forEach(line=>{
      const lab=line.querySelector('span');
      if(lab&&/^Échéance$/i.test((lab.textContent||'').trim()))lab.textContent='Fin estimée contrat';
    });

    if(!card.querySelector('.sd-renewal-note')){
      const note=document.createElement('div');note.className='sd-renewal-note';
      note.innerHTML='<b>Signal d’anticipation</b><br>Contrat public déjà attribué dont la fin approche. Il peut déboucher sur un renouvellement ou une remise en concurrence, mais aucun nouvel appel d’offres n’est garanti à ce stade.';
      const signal=card.querySelector('.signal');
      if(signal)signal.insertAdjacentElement('afterend',note);else card.appendChild(note);
    }

    const p=renewalPriority(o);
    const btn=card.querySelector('.sd-priority');
    if(btn){
      const priorityKey=p.label+'|'+p.cls;
      if(btn.dataset.sdRenewalPriority!==priorityKey){
        btn.dataset.sdRenewalPriority=priorityKey;
        btn.classList.remove('sd-hot','sd-warm','sd-cool');btn.classList.add(p.cls);
        const expanded=btn.getAttribute('aria-expanded')==='true';
        btn.innerHTML=p.label+' <span class="sd-chevron">'+(expanded?'▲':'▼')+'</span>';
      }
    }

    const details=card.querySelector('.sd-priority-details');
    if(details){
      const left=daysUntil(o?.deadline);
      const detailKey=String(o.id)+'|'+String(o.deadline||'')+'|'+String(o.locked||'');
      if(details.dataset.sdRenewalDetails!==detailKey){
        details.dataset.sdRenewalDetails=detailKey;
        const boxes=details.querySelectorAll('.sd-insight');
        const when=left===null?'La date de fin estimée n’est pas disponible dans l’aperçu gratuit.':`Fin de contrat estimée dans environ ${Math.max(0,left)} jours. Commencer la veille et la qualification commerciale maintenant. Il ne s’agit pas d’une date limite de réponse.`;
        if(boxes[0])boxes[0].innerHTML='<b>Pourquoi agir maintenant ?</b><br>'+when;
        if(boxes[2])boxes[2].innerHTML='<b>Action recommandée</b><br>'+(o?.locked?'Débloquer l’acheteur et les détails, puis surveiller la future consultation.':'Identifier le décideur DSI/achats, surveiller BOAMP et TED pour une nouvelle consultation, et préparer l’approche avant publication.');
      }
    }
  }

  function decorate(){
    document.querySelectorAll('#feed .card').forEach(card=>{
      const o=findOpp(card);if(!o||!isRenewal(o))return;decorateCard(card,o);
    });
  }

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
  const feed=document.getElementById('feed')||document.documentElement;
  const obs=new MutationObserver(schedule);
  obs.observe(feed,{subtree:true,childList:true});
  setInterval(decorate,2500);
  setTimeout(decorate,250);
})();