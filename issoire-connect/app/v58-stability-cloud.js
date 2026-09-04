(function(){
  'use strict';
  const V58_BUILD='2026-09-05-v58.0';
  if(typeof S==='undefined') return;

  S.proSettings=S.proSettings||{
    targetActivity:localStorage.getItem('ic_target')||'',
    targetZone:localStorage.getItem('ic_target_zone')||'Issoire',
    targetType:localStorage.getItem('ic_target_type')||'Particuliers + entreprises',
    remote:false
  };
  S.cloud=S.cloud||{online:navigator.onLine,public:'idle',private:'idle',lastSync:null,error:''};

  const style=document.createElement('style');
  style.textContent=`
  .cloud-card{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:14px;background:linear-gradient(110deg,#f8fbff,#fff);border-color:#cfdeee}
  .cloud-card h3{margin:8px 0 4px}.cloud-meta{text-align:right;white-space:nowrap}.cloud-meta b{display:block;color:var(--navy)}.cloud-meta span{font-size:10px;color:var(--muted)}
  @media(max-width:650px){.cloud-card{align-items:flex-start;flex-direction:column}.cloud-meta{text-align:left}}`;
  document.head.appendChild(style);

  function v58CloudState(){
    if(!navigator.onLine) return {label:'Hors connexion',cls:'red',detail:'Les données cloud seront actualisées au retour du réseau.'};
    if(typeof sb==='undefined'||!sb) return {label:'Mode local / démo',cls:'orange',detail:'Supabase n’est pas disponible dans cette session.'};
    if(S.session&&S.cloud.private==='ok') return {label:'Cloud synchronisé',cls:'green',detail:`Dernière synchro : ${S.cloud.lastSync?new Date(S.cloud.lastSync).toLocaleString('fr-FR'):'à l’instant'}`};
    if(S.cloud.private==='error') return {label:'Synchronisation partielle',cls:'red',detail:S.cloud.error||'Certaines données privées n’ont pas pu être chargées.'};
    if(S.session) return {label:'Cloud connecté',cls:'green',detail:'Compte authentifié, synchronisation en cours.'};
    return {label:'Cloud public actif',cls:'green',detail:'Connectez-vous pour synchroniser les données privées sur tous vos appareils.'};
  }
  window.v58CloudStatusHtml=function(){
    const c=v58CloudState();
    return `<div class="card cloud-card"><div><span class="pill ${c.cls}">${c.label}</span><h3>☁️ État de synchronisation</h3><p class="muted">${esc(c.detail)}</p></div><div class="cloud-meta"><b>V.58</b><span>Build ${V58_BUILD}</span></div></div>`;
  };

  const baseLoadPrivate=loadPrivate;
  loadPrivate=async function(){
    await baseLoadPrivate();
    if(!sb||!S.session) return;
    const uid=S.session.user.id;
    try{
      const {data:ps,error:pse}=await sb.from('ic_pro_settings').select('*').eq('owner_id',uid).maybeSingle();
      if(pse) throw pse;
      if(ps){
        S.proSettings={targetActivity:ps.target_activity||'',targetZone:ps.target_zone||'Issoire',targetType:ps.target_type||'Particuliers + entreprises',remote:true};
      }else if(localStorage.getItem('ic_target')){
        const seed={owner_id:uid,target_activity:localStorage.getItem('ic_target')||'',target_zone:localStorage.getItem('ic_target_zone')||'Issoire',target_type:localStorage.getItem('ic_target_type')||'Particuliers + entreprises',updated_at:new Date().toISOString()};
        const {data:created,error:ce}=await sb.from('ic_pro_settings').upsert(seed,{onConflict:'owner_id'}).select().maybeSingle();
        if(ce) throw ce;
        if(created) S.proSettings={targetActivity:created.target_activity||'',targetZone:created.target_zone||'Issoire',targetType:created.target_type||'Particuliers + entreprises',remote:true};
      }

      const {data:cs,error:cse}=await sb.from('ic_campaigns').select('*').order('created_at',{ascending:false}).limit(200);
      if(cse) throw cse;
      if((cs||[]).length){
        S.campaigns=cs.map(c=>({id:c.id,title:c.title,audience:c.audience,radius:String(c.radius_km),message:c.message||'',status:c.status,remote:true}));
      }else{
        const legacy=JSON.parse(localStorage.getItem('ic_campaigns')||'[]');
        if(legacy.length){
          const payloads=legacy.slice(0,50).map(c=>({owner_id:uid,title:c.title||'Campagne',audience:c.audience||'Habitants',radius_km:Number(c.radius||5),message:c.message||'',status:['Brouillon','Active','Terminée','Archivée'].includes(c.status)?c.status:'Brouillon'}));
          const {data:migrated,error:migErr}=await sb.from('ic_campaigns').insert(payloads).select();
          if(migErr) throw migErr;
          S.campaigns=(migrated||[]).map(c=>({id:c.id,title:c.title,audience:c.audience,radius:String(c.radius_km),message:c.message||'',status:c.status,remote:true}));
          localStorage.removeItem('ic_campaigns');
        }else S.campaigns=[];
      }
      S.cloud.private='ok';S.cloud.lastSync=new Date().toISOString();S.cloud.error='';
    }catch(e){
      S.cloud.private='error';S.cloud.error=e?.message||String(e);console.warn('V58 cloud',e);
    }
  };

  targetPage=function(){
    const t=S.proSettings||{};
    main.innerHTML=`<div class="section-head"><div><h2>◎ Ma clientèle cible</h2><p>Définissez le profil des prospects les plus intéressants. En V.58, ces réglages suivent votre compte.</p></div></div><div class="card"><div class="form"><label>Activité / besoin recherché</label><input id="targetActivity" value="${esc(t.targetActivity||'')}" placeholder="Ex. rénovation salle de bain"><label>Zone principale</label><select id="targetZone">${['Issoire','5 km autour d’Issoire','20 km autour d’Issoire','50 km autour d’Issoire'].map(x=>`<option ${x===(t.targetZone||'Issoire')?'selected':''}>${x}</option>`).join('')}</select><label>Type</label><select id="targetType">${['Particuliers','Entreprises','Particuliers + entreprises'].map(x=>`<option ${x===(t.targetType||'Particuliers + entreprises')?'selected':''}>${x}</option>`).join('')}</select><button class="btn primary" onclick="saveProSettingsV58()">Enregistrer</button></div></div>${v58CloudStatusHtml()}`;
  };

  window.saveProSettingsV58=async function(){
    const next={targetActivity:$('#targetActivity').value.trim(),targetZone:$('#targetZone').value,targetType:$('#targetType').value};
    S.proSettings={...next,remote:false};
    localStorage.setItem('ic_target',next.targetActivity);localStorage.setItem('ic_target_zone',next.targetZone);localStorage.setItem('ic_target_type',next.targetType);
    if(sb&&S.session){
      const payload={owner_id:S.session.user.id,target_activity:next.targetActivity,target_zone:next.targetZone,target_type:next.targetType,updated_at:new Date().toISOString()};
      const {error}=await sb.from('ic_pro_settings').upsert(payload,{onConflict:'owner_id'});
      if(error){S.cloud.private='error';S.cloud.error=error.message;return say('Sauvegarde locale OK, cloud indisponible : '+error.message)}
      S.proSettings.remote=true;S.cloud.private='ok';S.cloud.lastSync=new Date().toISOString();say('Clientèle cible synchronisée');
    }else say('Clientèle cible enregistrée sur cet appareil');
  };

  campaignsPage=function(){
    main.innerHTML=`<div class="section-head"><div><h2>📣 Mes campagnes</h2><p>Brouillons synchronisés entre vos appareils lorsque vous êtes connecté.</p></div><button class="btn primary" onclick="newCampaign()">+ Nouvelle campagne</button></div>${S.campaigns.length?`<div class="grid g2">${S.campaigns.map(c=>`<article class="card campaign"><div><span class="pill orange">${esc(c.audience)}</span><h3>${esc(c.title)}</h3><div class="meta">📍 ${esc(c.radius)} km · ${esc(c.status)} ${c.remote?'· ☁️':''}</div><p class="muted">${esc(c.message)}</p></div><button class="btn small" onclick="deleteCampaign('${c.id}')">✕</button></article>`).join('')}</div>`:'<div class="card soft"><h3>Votre première campagne locale</h3><p class="muted">Créez un brouillon : il sera stocké dans le cloud dès que votre compte est connecté.</p></div>'}${v58CloudStatusHtml()}`;
  };

  saveCampaign=async function(){
    const title=$('#campTitle').value.trim();if(!title)return say('Indiquez un nom');
    const draft={id:'c'+Date.now(),title,audience:$('#campAudience').value,radius:$('#campRadius').value,message:$('#campMessage').value.trim(),status:'Brouillon',remote:false};
    if(sb&&S.session){
      const {data,error}=await sb.from('ic_campaigns').insert({owner_id:S.session.user.id,title:draft.title,audience:draft.audience,radius_km:Number(draft.radius),message:draft.message,status:draft.status}).select().single();
      if(error)return say('Campagne non synchronisée : '+error.message);
      S.campaigns.unshift({id:data.id,title:data.title,audience:data.audience,radius:String(data.radius_km),message:data.message||'',status:data.status,remote:true});
      S.cloud.private='ok';S.cloud.lastSync=new Date().toISOString();
    }else{
      S.campaigns.unshift(draft);localStorage.setItem('ic_campaigns',JSON.stringify(S.campaigns.filter(c=>!c.remote)));
    }
    closeModal();say(sb&&S.session?'Campagne créée et synchronisée':'Campagne créée sur cet appareil');campaignsPage();
  };

  deleteCampaign=async function(id){
    const row=S.campaigns.find(c=>String(c.id)===String(id));
    if(row?.remote&&sb&&S.session){const {error}=await sb.from('ic_campaigns').delete().eq('id',id);if(error)return say(error.message)}
    S.campaigns=S.campaigns.filter(c=>String(c.id)!==String(id));localStorage.setItem('ic_campaigns',JSON.stringify(S.campaigns.filter(c=>!c.remote)));campaignsPage();
  };

  const baseAccountPage=accountPage;
  accountPage=function(){baseAccountPage();main.insertAdjacentHTML('beforeend',v58CloudStatusHtml())};

  const baseInstallApp=installApp;
  installApp=async function(){
    if(S.installPrompt) return baseInstallApp();
    openModal(`<h2>Installer Issoire Connect V.58</h2><p><b>Android / Chrome :</b> menu ⋮ → <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b>.</p><p><b>iPhone / Safari :</b> Partager → <b>Sur l’écran d’accueil</b>.</p><div class="orange-note">La version publique est déjà hébergée en HTTPS. Si une ancienne version reste affichée, ouvrez le lien web puis réinstallez le raccourci.</div>`);
  };

  window.addEventListener('online',()=>{S.cloud.online=true;say('Connexion rétablie');});
  window.addEventListener('offline',()=>{S.cloud.online=false;say('Mode hors connexion');});
  console.info('Issoire Connect V.58 stability/cloud patch',V58_BUILD);
})();
