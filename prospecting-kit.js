(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .sd-prospect-btn{border:1px solid #3e6f63!important;background:#102c26!important;color:#bff0dc!important;font-weight:850!important}
    .sd-prospect-btn.locked{border-color:#51466d!important;background:#1b1830!important;color:#d9d1ef!important}
    .sd-prospect-kit{margin-top:10px;padding:13px;border:1px solid #315b51;background:linear-gradient(135deg,#0e241f,#0c1b28);border-radius:12px;font-size:10px;line-height:1.55;color:#d2e8e0}
    .sd-prospect-title{font-size:12px;font-weight:900;color:#72e0ae;margin-bottom:9px}.sd-prospect-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sd-prospect-box{border:1px solid #29493f;background:#091b17;border-radius:9px;padding:9px}.sd-prospect-box b{color:#93eac1}.sd-prospect-check{margin:8px 0 0;padding-left:18px}.sd-prospect-check li{margin:4px 0}.sd-prospect-warning{margin-top:9px;color:#b8c7df;font-size:9px}.sd-prospect-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.sd-prospect-actions button{border:1px solid #39765f;background:#15382a;color:#c9f4df;border-radius:8px;padding:7px 9px;font-weight:800;cursor:pointer}.sd-prospect-actions button.secondary{border-color:#345273;background:#122741;color:#cae2ff}.sd-prospect-actions button:disabled{opacity:.5;cursor:not-allowed}@media(max-width:700px){.sd-prospect-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function esc(v){try{return escapeHtml(String(v??''))}catch(e){return String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]))}}
  function findOpp(card){const id=(card.id||'').replace(/^card-/,'');try{return Array.isArray(feed)?feed.find(x=>String(x.id)===id):null}catch(e){return null}}
  function getOpp(id){try{return Array.isArray(feed)?feed.find(x=>String(x.id)===String(id)):null}catch(e){return null}}
  function renewal(o){return /Renouvellement DECP/i.test(String(o?.sector||''))||/^Renouvellement probable/i.test(String(o?.title||''))}
  function context(o){return ` ${o?.title||''} ${o?.probable_need||''} ${o?.signal||''} `.toLowerCase()}
  function decisionMakers(o){const t=context(o);const roles=[];if(/cyber|sécur|security|siem|soc/.test(t))roles.push('RSSI / responsable cybersécurité');if(/data|intelligence artificielle|\bia\b|analytics|database/.test(t))roles.push('Responsable Data / DSI');if(/erp|sap|crm|sirh|application|logiciel/.test(t))roles.push('DSI / responsable applicatif');if(/réseau|reseau|télécom|telecom|fibre|wifi|serveur|stockage|cloud|infogér/.test(t))roles.push('DSI / responsable infrastructure');if(!roles.length)roles.push('DSI / responsable numérique');roles.push('Responsable achats / marchés publics');return [...new Set(roles)].join(' · ')}
  function angle(o){const n=o?.probable_need||o?.title||'le besoin numérique détecté';if(renewal(o))return `Se positionner en amont sur ${n}, comprendre le calendrier de renouvellement et surveiller la future consultation officielle.`;return `Vérifier l’objet exact, les critères et l’échéance sur la source officielle, puis évaluer si votre offre couvre réellement ${n}.`}
  function firstAction(o){if(renewal(o))return 'Ajouter au pipeline, identifier les rôles DSI/achats et créer une veille sur la future consultation.';return 'Ouvrir la source officielle, confirmer l’éligibilité et décider rapidement : répondre, partenaire ou abandon.'}
  function legalNote(o){return renewal(o)?'Signal d’anticipation : le renouvellement n’est pas garanti. Toute prise de contact doit respecter les règles de la commande publique et ne pas chercher à obtenir un traitement préférentiel.':'Si une consultation est déjà ouverte, respectez strictement les canaux, délais et règles d’égalité de traitement prévus par l’acheteur public.'}
  function renewalMessage(o){const need=o?.probable_need||'vos enjeux numériques';return `Bonjour,\n\nJe me permets de vous contacter au sujet de vos enjeux autour de ${need}. Notre activité intervient sur ce type de besoin et je souhaiterais simplement comprendre vos orientations à venir et vous présenter brièvement nos capacités.\n\nS’il existe ou s’il est prévu une procédure de consultation, nous respecterons naturellement les canaux officiels et les règles de la commande publique.\n\nBien cordialement`}
  async function copyText(text,button){try{await navigator.clipboard.writeText(text);const old=button.textContent;button.textContent='✓ Copié';setTimeout(()=>button.textContent=old,1800)}catch(e){window.prompt('Copiez ce texte :',text)}}

  function kit(o){const isRenewal=renewal(o);return '<div class="sd-prospect-title">🚀 Plan d’action commercial</div><div class="sd-prospect-grid">'+
    '<div class="sd-prospect-box"><b>Besoin à qualifier</b><br>'+esc(o?.probable_need||o?.title||'Besoin numérique à confirmer')+'</div>'+
    '<div class="sd-prospect-box"><b>Interlocuteurs à rechercher</b><br>'+esc(decisionMakers(o))+'</div>'+
    '<div class="sd-prospect-box"><b>Angle d’approche</b><br>'+esc(angle(o))+'</div>'+
    '<div class="sd-prospect-box"><b>Première action</b><br>'+esc(firstAction(o))+'</div></div>'+
    '<ul class="sd-prospect-check"><li>Vérifier la source et le calendrier.</li><li>Confirmer l’adéquation avec votre offre.</li><li>Choisir : direct, partenaire ou apport d’affaires.</li><li>Ajouter au pipeline et définir le prochain suivi.</li></ul>'+
    '<div class="sd-prospect-warning">⚖️ '+esc(legalNote(o))+'</div>'+
    '<div class="sd-prospect-actions"><button type="button" data-sd-add-pipeline="'+esc(o.id)+'">+ Ajouter au pipeline</button><button type="button" class="secondary" data-sd-copy-angle="'+esc(o.id)+'">Copier l’angle</button>'+
    (o?.source_url?'<button type="button" class="secondary" data-sd-open-source="'+esc(o.id)+'">Source officielle ↗</button>':'')+
    (isRenewal?'<button type="button" class="secondary" data-sd-copy-message="'+esc(o.id)+'">Copier un message prudent</button>':'')+'</div>'}

  function decorate(){document.querySelectorAll('#feed .card').forEach(card=>{const o=findOpp(card);if(!o)return;const actions=card.querySelector('.actions');if(!actions||actions.querySelector('.sd-prospect-btn'))return;const allowed=['pro','agency'].includes(String(currentPlan||''));const b=document.createElement('button');b.type='button';b.className='sd-prospect-btn'+(allowed?'':' locked');b.textContent=allowed?'🚀 Préparer ma prospection':'🔒 Plan de prospection — Pro';b.addEventListener('click',()=>{if(!['pro','agency'].includes(String(currentPlan||''))){scrollToPricing();return}let p=card.querySelector('.sd-prospect-kit');if(p){p.remove();return}p=document.createElement('div');p.className='sd-prospect-kit';p.innerHTML=kit(o);card.appendChild(p)});actions.appendChild(b)})}

  document.addEventListener('click',e=>{
    const pipe=e.target.closest('[data-sd-add-pipeline]');if(pipe){const id=pipe.getAttribute('data-sd-add-pipeline');if(id&&typeof window.addPipeline==='function')window.addPipeline(id);return}
    const copyAngle=e.target.closest('[data-sd-copy-angle]');if(copyAngle){const o=getOpp(copyAngle.getAttribute('data-sd-copy-angle'));if(o)copyText(angle(o),copyAngle);return}
    const copyMessage=e.target.closest('[data-sd-copy-message]');if(copyMessage){const o=getOpp(copyMessage.getAttribute('data-sd-copy-message'));if(o)copyText(renewalMessage(o),copyMessage);return}
    const source=e.target.closest('[data-sd-open-source]');if(source){const o=getOpp(source.getAttribute('data-sd-open-source'));if(o?.source_url)window.open(o.source_url,'_blank','noopener,noreferrer')}
  });
  const obs=new MutationObserver(decorate);obs.observe(document.documentElement,{subtree:true,childList:true});setInterval(decorate,1000);setTimeout(decorate,500);
})();