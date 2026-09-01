(()=>{
  'use strict';
  const ZP={caps:null,observer:null};
  const css=document.createElement('style');
  css.textContent=`
  .zp360-suite{margin:0 0 14px;padding:14px;border:1px solid #315b73;background:linear-gradient(135deg,#0d1e34,#0d2822);border-radius:14px}
  .zp360-suite h3{margin:0 0 5px;font-size:15px}.zp360-suite p{margin:0 0 10px;color:#aebed8;font-size:10px;line-height:1.45}
  .zp360-suite-actions{display:flex;gap:7px;flex-wrap:wrap}.zp360-suite-actions button{font-size:10px;padding:8px 10px}
  .zp360-enrich-btn{border-color:#39765f!important;background:#15382a!important;color:#c9f4df!important;font-weight:800!important}
  .zp360-enriched{margin-top:10px;padding:10px;border:1px solid #315b51;background:#0b211c;border-radius:10px;font-size:10px;line-height:1.5}
  .zp360-enriched h4{margin:0 0 6px;color:#72e0ae;font-size:12px}.zp360-enriched .warn{color:#d9c77f}.zp360-enriched .ok{color:#8be8bd}
  .zp360-modal-backdrop{position:fixed;inset:0;background:rgba(2,7,15,.76);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px}
  .zp360-modal{width:min(760px,100%);max-height:85vh;overflow:auto;background:#0d172b;border:1px solid #315273;border-radius:16px;padding:16px;box-shadow:0 24px 70px rgba(0,0,0,.45)}
  .zp360-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.zp360-modal-head h3{margin:0}.zp360-modal .close{border:1px solid #4a5870;background:#151f34;color:#fff;border-radius:8px;padding:6px 9px}
  .zp360-table{width:100%;border-collapse:collapse;font-size:10px}.zp360-table th,.zp360-table td{text-align:left;padding:8px;border-bottom:1px solid #22344f;vertical-align:top}.zp360-table th{color:#9eb0cf}
  .zp360-row-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.zp360-row-actions button{font-size:10px;padding:7px 9px}
  @media(max-width:650px){.zp360-suite-actions button{flex:1 1 42%}.zp360-table{font-size:9px}}
  `;
  document.head.appendChild(css);

  function e(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function plan(){try{return String(currentPlan||'free')}catch{return 'free'}}
  function hasSession(){try{return !!session}catch{return false}}
  function appClient(){try{return client}catch{return null}}
  function items(){try{return Array.isArray(allItems)?allItems:[]}catch{return []}}
  function toast(msg){const s=document.getElementById('searchStatus');if(s)s.textContent=msg;else alert(msg)}
  function csvCell(v){const s=String(v??'');return /[;"\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
  function download(name,text,type='text/csv;charset=utf-8'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500)}

  async function loadCaps(){
    const c=appClient(); if(!c)return null;
    let p=plan();
    if(hasSession()){
      const {data:sub}=await c.from('subscriptions').select('plan,status,cancel_at_period_end,updated_at').eq('user_id',session.user.id).eq('livemode',true).in('status',['active','trialing']).eq('cancel_at_period_end',false).order('updated_at',{ascending:false}).limit(1).maybeSingle();
      if(sub?.plan){p=String(sub.plan);try{currentPlan=p}catch{}}
    }
    const {data,error}=await c.from('plan_catalog').select('id,max_feed_rows,can_export,can_company_enrich,monthly_company_enrichments,can_import_contacts,can_saved_searches').eq('id',p).maybeSingle();
    if(!error&&data){ZP.caps=data;try{if(data.max_feed_rows)planMax=Number(data.max_feed_rows)}catch{}}
    return ZP.caps;
  }

  function suitePanel(){
    const right=document.querySelector('#app > section'); if(!right||document.getElementById('zp360Suite'))return;
    const panel=document.createElement('div'); panel.id='zp360Suite'; panel.className='zp360-suite';
    panel.innerHTML=`<h3>⚡ Suite commerciale 360</h3><p>Enrichissement entreprise, dirigeants publics, import/export et recherches sauvegardées. Aucun email ou téléphone n’est inventé : une coordonnée n’est affichée que si elle vient d’un fournisseur professionnel configuré ou de vos propres données importées.</p><div class="zp360-suite-actions"><button class="btn" id="zpImport">Importer CSV</button><button class="btn" id="zpExport">Exporter CSV</button><button class="btn" id="zpSaveSearch">Sauvegarder la recherche</button><button class="btn" id="zpSavedSearches">Mes recherches</button></div><input id="zpCsvInput" type="file" accept=".csv,text/csv" hidden>`;
    right.insertBefore(panel,right.firstChild);
    document.getElementById('zpImport').onclick=importCsvClick;
    document.getElementById('zpExport').onclick=exportCsv;
    document.getElementById('zpSaveSearch').onclick=saveSearch;
    document.getElementById('zpSavedSearches').onclick=listSavedSearches;
    document.getElementById('zpCsvInput').addEventListener('change',handleCsvFile);
  }

  async function importCsvClick(){const caps=await loadCaps();if(!caps?.can_import_contacts){toast('L’import CSV est disponible à partir de la formule Essentiel.');return}document.getElementById('zpCsvInput')?.click()}
  function parseCsv(text){
    const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim()); if(!lines.length)return [];
    const sep=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?';':',';
    const parse=(line)=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}else if(ch===sep&&!q){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out.map(x=>x.trim())};
    const header=parse(lines.shift()).map(x=>x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
    return lines.slice(0,1000).map(parse).map(cols=>Object.fromEntries(header.map((h,i)=>[h,cols[i]||''])));
  }
  function pick(row,names){for(const n of names)if(row[n])return row[n];return ''}
  async function handleCsvFile(ev){
    const file=ev.target.files?.[0]; ev.target.value=''; if(!file)return;
    const rows=parseCsv(await file.text()); if(!rows.length){toast('CSV vide ou illisible.');return}
    const target=items(); const seen=new Set(target.map(x=>x.key)); let added=0;
    const limit=(()=>{try{return Number(planMax||5)}catch{return 5}})();
    for(const r of rows){
      if(target.length>=limit)break;
      const company=pick(r,['entreprise','company','societe','société','nom','raison_sociale']); if(!company)continue;
      const siren=pick(r,['siren']),siret=pick(r,['siret']),city=pick(r,['ville','city']),postal=pick(r,['code_postal','postal_code','cp']);
      const email=pick(r,['email','e-mail','mail']),phone=pick(r,['telephone','téléphone','phone','tel']),contact=pick(r,['contact','nom_contact','contact_name']);
      const key=`import:${siret||siren||company+'-'+city}`.toLowerCase(); if(seen.has(key))continue; seen.add(key);
      target.push({key,lead_kind:'business',company,title:'Prospect importé',segment_label:'Import CSV',siren:siren||null,siret:siret||null,postal_code:postal||null,city:city||null,score:70,signal:'Prospect importé par l’utilisateur.',contact_name:contact||null,contact_email:email||null,contact_phone:phone||null,contactability:(email||phone)?'Coordonnées importées par l’utilisateur — statut de vérification inconnu.':'Aucune coordonnée importée.',source_label:'Import CSV utilisateur',source_url:null});
      added++;
    }
    try{renderResults()}catch{}
    decorateCards(); toast(`${added} prospect(s) importé(s) depuis le CSV. Les coordonnées importées ne sont pas marquées comme vérifiées.`);
  }

  async function exportCsv(){
    const caps=await loadCaps(); if(!caps?.can_export){toast('L’export CSV est disponible avec les formules Pro et Agence.');return}
    const rows=items(); if(!rows.length){toast('Aucun prospect à exporter.');return}
    const headers=['entreprise','siren','siret','type','secteur','ville','code_postal','distance_km','score','contact','email','telephone','statut_contact','source'];
    const out=[headers.join(';')];
    for(const x of rows)out.push([x.company,x.siren,x.siret,x.lead_kind,x.segment_label||x.sector,x.city,x.postal_code,x.distance_km,x.score,x.contact_name,x.contact_email,x.contact_phone,x.contactability,x.source_url].map(csvCell).join(';'));
    download(`zoneprospect360-${new Date().toISOString().slice(0,10)}.csv`,'\uFEFF'+out.join('\n'));
  }

  function currentSearch(){
    const vals=(cls)=>[...document.querySelectorAll(cls+':checked')].map(x=>x.value);
    return {profession:document.getElementById('profession')?.value.trim()||'',postal_code:document.getElementById('postalCode')?.value.trim()||null,city:document.getElementById('city')?.value.trim()||null,radius_km:Number(document.getElementById('radius')?.value||25),target_types:vals('.targetType'),target_segments:vals('.segCheck')};
  }
  async function saveSearch(){
    const caps=await loadCaps(); if(!caps?.can_saved_searches){toast('Les recherches sauvegardées sont disponibles à partir de la formule Essentiel.');return}
    if(!hasSession()){toast('Connexion nécessaire.');return}
    const s=currentSearch(); if(!s.profession||(!s.postal_code&&!s.city)){toast('Configurez d’abord votre métier et votre zone.');return}
    const name=window.prompt('Nom de cette recherche :',`${s.profession} · ${s.city||s.postal_code||''}`); if(!name)return;
    const c=appClient(); const {error}=await c.from('zp360_saved_searches').insert({user_id:session.user.id,name:name.slice(0,100),...s,active:true});
    toast(error?'Impossible de sauvegarder : '+error.message:'Recherche sauvegardée.');
  }
  async function listSavedSearches(){
    const caps=await loadCaps(); if(!caps?.can_saved_searches){toast('Les recherches sauvegardées sont disponibles à partir de la formule Essentiel.');return}
    const c=appClient(); const {data,error}=await c.from('zp360_saved_searches').select('*').eq('user_id',session.user.id).order('updated_at',{ascending:false}).limit(50);
    if(error){toast('Recherches sauvegardées indisponibles.');return}
    modal('Mes recherches sauvegardées',data?.length?`<table class="zp360-table"><thead><tr><th>Nom</th><th>Ciblage</th><th>Actions</th></tr></thead><tbody>${data.map(s=>`<tr><td><b>${e(s.name)}</b></td><td>${e(s.profession)} · ${e(s.city||s.postal_code||'')} · ${e(s.radius_km)} km</td><td><button class="btn" data-zp-load="${e(s.id)}">Charger</button> <button class="btn danger" data-zp-del="${e(s.id)}">Supprimer</button></td></tr>`).join('')}</tbody></table>`:'<p>Aucune recherche sauvegardée.</p>',data||[]);
  }
  async function loadSaved(id,list){const s=list.find(x=>x.id===id);if(!s)return;document.getElementById('profession').value=s.profession||'';document.getElementById('postalCode').value=s.postal_code||'';document.getElementById('city').value=s.city||'';document.getElementById('radius').value=String(s.radius_km||25);try{renderSegments(s.target_segments||[])}catch{}document.querySelectorAll('.targetType').forEach(x=>x.checked=(s.target_types||[]).includes(x.value));closeModal();toast('Recherche chargée. Vous pouvez relancer le radar.');}
  async function deleteSaved(id){const c=appClient();const {error}=await c.from('zp360_saved_searches').delete().eq('id',id).eq('user_id',session.user.id);if(error)toast('Suppression impossible.');else{closeModal();listSavedSearches()}}

  function modal(title,html,list=[]){
    closeModal(); const d=document.createElement('div'); d.className='zp360-modal-backdrop'; d.id='zp360Modal'; d.innerHTML=`<div class="zp360-modal"><div class="zp360-modal-head"><h3>${e(title)}</h3><button class="close" data-zp-close>✕</button></div><div>${html}</div></div>`; document.body.appendChild(d);
    d.addEventListener('click',ev=>{if(ev.target===d||ev.target.closest('[data-zp-close]'))closeModal();const l=ev.target.closest('[data-zp-load]');if(l)loadSaved(l.dataset.zpLoad,list);const del=ev.target.closest('[data-zp-del]');if(del)deleteSaved(del.dataset.zpDel)});
  }
  function closeModal(){document.getElementById('zp360Modal')?.remove()}

  async function enrich(index,card,button){
    const x=items()[index]; if(!x||x.lead_kind!=='business')return;
    const caps=await loadCaps(); if(!caps?.can_company_enrich){toast('Enrichissement indisponible pour cette formule.');return}
    button.disabled=true; const old=button.textContent; button.textContent='Enrichissement…';
    try{
      const c=appClient(); const {data,error}=await c.functions.invoke('zoneprospect360-enrich-company',{body:{prospect_key:x.key,siren:x.siren||null,siret:x.siret||null,company_name:x.company||null}});
      if(error)throw error; if(data?.error){if(data.error==='monthly_enrichment_limit_reached')throw new Error(`Quota mensuel atteint (${data.used}/${data.limit}).`);throw new Error(data.error)}
      x.siren=data.company?.siren||x.siren;x.siret=data.company?.siret||x.siret;x.enrichment=data;
      const first=(data.contacts||[])[0]; if(first){x.contact_name=first.name||x.contact_name;x.contact_email=first.email||x.contact_email;x.contact_phone=first.phone||x.contact_phone;x.contactability=`Coordonnée professionnelle fournisseur · ${data.verification_status||'statut à vérifier'}`}
      showEnrichment(card,data); toast(`Enrichissement terminé · ${data.usage?.used||0}/${data.usage?.limit||'—'} ce mois-ci.`);
    }catch(err){toast('Enrichissement impossible : '+(err?.message||'erreur'));}
    finally{button.disabled=false;button.textContent=old}
  }
  function showEnrichment(card,data){
    card.querySelector('.zp360-enriched')?.remove(); const company=data.company||{},contacts=data.contacts||[],execs=company.executives||[];
    const box=document.createElement('div'); box.className='zp360-enriched';
    box.innerHTML=`<h4>🔎 Fiche entreprise enrichie</h4><div><b>${e(company.legal_name||'Entreprise')}</b>${company.siren?` · SIREN ${e(company.siren)}`:''}${company.siret?` · SIRET ${e(company.siret)}`:''}</div>${company.activity_label||company.activity_code?`<div>Activité : ${e(company.activity_label||company.activity_code)}</div>`:''}${company.employee_band?`<div>Tranche d’effectif : ${e(company.employee_band)}</div>`:''}${execs.length?`<div style="margin-top:6px"><b>Dirigeants / rôles publics :</b><br>${execs.slice(0,6).map(d=>`${e(d.name||'')} ${d.role?'— '+e(d.role):''}`).join('<br>')}</div>`:''}${contacts.length?`<div class="ok" style="margin-top:6px"><b>Coordonnées professionnelles fournisseur :</b><br>${contacts.slice(0,5).map(c=>`${e(c.name||c.role||'Contact')} ${c.email?'· ✉ '+e(c.email):''} ${c.phone?'· ☎ '+e(c.phone):''} ${c.email_status||c.phone_status?'· '+e(c.email_status||c.phone_status):''}`).join('<br>')}</div>`:`<div class="warn" style="margin-top:6px">${e(data.notice||'Données publiques uniquement. Aucun email ou téléphone inventé.')}</div>`}${company.official_url?`<div class="zp360-row-actions"><a class="btn" href="${e(company.official_url)}" target="_blank" rel="noopener">Fiche officielle ↗</a></div>`:''}`;
    card.appendChild(box);
  }

  function decorateCards(){
    document.querySelectorAll('#results .card').forEach((card,index)=>{
      const x=items()[index]; if(!x||x.lead_kind!=='business')return; const actions=card.querySelector('.actions'); if(!actions||actions.querySelector('.zp360-enrich-btn'))return;
      const b=document.createElement('button');b.type='button';b.className='zp360-enrich-btn';b.textContent='🔎 Enrichir l’entreprise';b.onclick=()=>enrich(index,card,b);actions.insertBefore(b,actions.firstChild);
      if(x.enrichment)showEnrichment(card,x.enrichment);
    });
  }

  async function boot(){suitePanel();await loadCaps();decorateCards();if(ZP.observer)ZP.observer.disconnect();ZP.observer=new MutationObserver(()=>decorateCards());const r=document.getElementById('results');if(r)ZP.observer.observe(r,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else setTimeout(boot,0);
})();
