(()=>{
  const REGION_NAMES={'11':'Île-de-France','24':'Centre-Val de Loire','27':'Bourgogne-Franche-Comté','28':'Normandie','32':'Hauts-de-France','44':'Grand Est','52':'Pays de la Loire','53':'Bretagne','75':'Nouvelle-Aquitaine','76':'Occitanie','84':'Auvergne-Rhône-Alpes','93':'Provence-Alpes-Côte d’Azur','94':'Corse','01':'Guadeloupe','02':'Martinique','03':'Guyane','04':'La Réunion','06':'Mayotte'};
  const SPECS=[['cybersecurity','Cybersécurité'],['cloud','Cloud / infogérance'],['software_erp_crm','Logiciels / ERP / CRM'],['data_ai','Data / IA'],['network_telecom','Réseaux / télécoms'],['hardware_it','Matériel IT'],['digital_av','Audiovisuel numérique']];
  let profile=null,initUser='';
  const baseLoadFeed=window.loadFeed;

  const style=document.createElement('style');
  style.textContent=`
  .sd-personal{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.sd-box{background:#0e1a31;border:1px solid #2f466a;border-radius:14px;padding:14px;color:#cbd8ee;font-size:11px;line-height:1.5}.sd-box strong{color:#9fe3ff;font-size:12px}.sd-note{font-size:10px;color:#8298ba;margin-top:5px}.sd-btn{margin-top:10px;border:1px solid #4b83a5;background:#14374d;color:#c9f1ff;border-radius:9px;padding:9px 11px;font-weight:800;cursor:pointer}.sd-btn.good{background:#15382a;border-color:#2e684f;color:#b5f1d1}.sd-btn:disabled{opacity:.65;cursor:wait}.sd-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.sd-chip{display:flex;align-items:center;gap:5px;border:1px solid #34496d;background:#0a162a;border-radius:999px;padding:7px 9px;cursor:pointer}.sd-chip input{width:auto;margin:0}.sd-status{color:#5be39d;font-size:10px;margin-left:6px}.sd-free-banner{margin:0 0 14px;padding:13px 15px;border:1px solid #315f7d;background:linear-gradient(135deg,#10283d,#0b1d31);border-radius:13px;font-size:11px;line-height:1.55;color:#d9ecff}.sd-free-banner b{color:#68d5ff}.sd-preview{border-color:#4a9dc2!important;color:#9fe3ff!important;background:#12304a!important;font-weight:850}.sd-value{margin:9px 0;padding:10px 11px;border:1px solid #285747;background:#0d2822;border-radius:9px;font-size:11px;line-height:1.55;color:#c6efd9}.sd-value b{color:#5be39d}.sd-unlock{background:#68d5ff!important;color:#04121c!important;border-color:#68d5ff!important;font-weight:900!important}.sd-toast{position:fixed;right:18px;bottom:18px;z-index:9999;max-width:380px;padding:11px 13px;border-radius:10px;border:1px solid #31567b;background:#10233c;color:#d9ecff;font-size:11px;box-shadow:0 14px 38px rgba(0,0,0,.35);opacity:0;transform:translateY(8px);transition:.18s}.sd-toast.show{opacity:1;transform:none}.sd-toast.ok{border-color:#2e684f;background:#0d2822;color:#c6efd9}.sd-toast.err{border-color:#6e3740;background:#321a1d;color:#ffd0d4}@media(max-width:850px){.sd-personal{grid-template-columns:1fr}.sd-toast{left:14px;right:14px;bottom:14px;max-width:none}}
  `;
  document.head.appendChild(style);

  function esc(v){try{return escapeHtml(String(v??''))}catch(e){return String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]))}}
  function toast(message,type='ok'){let el=document.getElementById('sdToast');if(!el){el=document.createElement('div');el.id='sdToast';el.className='sd-toast';document.body.appendChild(el)}el.className='sd-toast '+type;el.textContent=message;requestAnimationFrame(()=>el.classList.add('show'));clearTimeout(window.__sdToastTimer);window.__sdToastTimer=setTimeout(()=>el.classList.remove('show'),3200)}
  function dashboardHead(){return document.getElementById('dashboard')?.querySelector('.dashhead')||null}
  function ensurePersonal(){const head=dashboardHead();if(!head)return null;let wrap=document.getElementById('sdPersonal');if(!wrap){wrap=document.createElement('div');wrap.id='sdPersonal';wrap.className='sd-personal';wrap.innerHTML='<div id="sdGeo" class="sd-box"></div><div id="sdBiz" class="sd-box"></div>';head.insertAdjacentElement('afterend',wrap)}return wrap}
  function renderGeo(text,active=false){ensurePersonal();const box=document.getElementById('sdGeo');if(!box)return;box.innerHTML='<strong>📍 Opportunités près de vous</strong><br>'+text+'<div class="sd-note">Vos coordonnées GPS exactes ne sont pas enregistrées. ZoneProspect 360 mémorise uniquement le département et la région.</div><button id="sdGeoBtn" class="sd-btn '+(active?'good':'')+'" data-sd-action="locate">'+(active?'Actualiser ma zone':'Utiliser ma position')+'</button>'}
  function renderBiz(selected=[]){ensurePersonal();const box=document.getElementById('sdBiz');if(!box)return;const set=new Set(selected||[]);box.innerHTML='<strong>🎯 Ce que je vends</strong><span id="sdBizStatus" class="sd-status"></span><div class="sd-note">Les affaires proches qui correspondent à votre activité remontent en premier.</div><div class="sd-chips">'+SPECS.map(([v,l])=>'<label class="sd-chip"><input type="checkbox" name="sdSpec" value="'+v+'" '+(set.has(v)?'checked':'')+'> '+l+'</label>').join('')+'</div><button id="sdBizBtn" class="sd-btn" data-sd-action="save-specs">Enregistrer mes activités</button>'}

  async function readProfile(){if(!session?.user?.id)return null;const {data,error}=await client.from('profiles').select('department,region,commercial_specialties').eq('id',session.user.id).maybeSingle();if(error){toast('Impossible de charger votre profil : '+error.message,'err');return null}return data||null}
  async function resolveZone(lat,lon){const u='https://geo.api.gouv.fr/communes?lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&fields=nom,codeDepartement,codeRegion&format=json';const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error('Service de localisation indisponible');const rows=await r.json();const c=Array.isArray(rows)?rows[0]:null;if(!c)throw new Error('Commune introuvable');return{department:c.codeDepartement||null,region:REGION_NAMES[c.codeRegion]||null,city:c.nom||null}}

  window.signalDealLocate=()=>{
    if(!session?.user?.id){toast('Connectez-vous avant d’utiliser la localisation.','err');return}
    if(!navigator.geolocation){renderGeo('Votre navigateur ne permet pas la géolocalisation. Utilisez le filtre région.');toast('Géolocalisation indisponible sur ce navigateur.','err');return}
    const btn=document.getElementById('sdGeoBtn');if(btn){btn.disabled=true;btn.textContent='Localisation…'}
    renderGeo('Autorisez votre navigateur à déterminer votre zone commerciale…');
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const z=await resolveZone(pos.coords.latitude,pos.coords.longitude);if(!z.region)throw new Error('Région non reconnue');
        const {error}=await client.from('profiles').update({department:z.department,region:z.region,location_updated_at:new Date().toISOString()}).eq('id',session.user.id);if(error)throw error;
        profile={...(profile||{}),department:z.department,region:z.region};const select=document.getElementById('region');if(select)select.value='';
        renderGeo('Zone détectée : <b>'+esc(z.region)+'</b>'+(z.department?' · département '+esc(z.department):'')+'.',true);toast('Zone enregistrée : '+z.region);await window.loadFeed();
      }catch(e){renderGeo('Impossible de déterminer votre zone. Vous pouvez utiliser le filtre région.');toast('Localisation impossible : '+(e?.message||'erreur inconnue'),'err')}
    },err=>{renderGeo('Position refusée. Vous pouvez utiliser le filtre région sans partager votre position.');toast(err?.code===1?'Autorisation de localisation refusée.':'Impossible d’obtenir votre position.','err')},{enableHighAccuracy:false,timeout:10000,maximumAge:86400000});
  };

  window.signalDealSaveSpecs=async()=>{
    if(!session?.user?.id){toast('Connectez-vous avant d’enregistrer vos activités.','err');return}
    const values=[...document.querySelectorAll('input[name="sdSpec"]:checked')].map(x=>x.value),st=document.getElementById('sdBizStatus'),btn=document.getElementById('sdBizBtn');
    if(st)st.textContent='Enregistrement…';if(btn){btn.disabled=true;btn.textContent='Enregistrement…'}
    const {error}=await client.from('profiles').update({commercial_specialties:values}).eq('id',session.user.id);
    if(error){if(st)st.textContent='Erreur';if(btn){btn.disabled=false;btn.textContent='Enregistrer mes activités'}toast('Impossible d’enregistrer vos activités : '+error.message,'err');return}
    profile={...(profile||{}),commercial_specialties:values};renderBiz(values);const ok=document.getElementById('sdBizStatus');if(ok)ok.textContent='✓ Enregistré';toast(values.length?'Activités enregistrées.':'Préférences métier réinitialisées.');await window.loadFeed();
  };

  document.addEventListener('click',e=>{const btn=e.target.closest('[data-sd-action]');if(!btn)return;const a=btn.dataset.sdAction;if(a==='locate')window.signalDealLocate();if(a==='save-specs')window.signalDealSaveSpecs()});

  window.loadFeed=async()=>{
    if(!session)return;const chosen=document.getElementById('region')?.value||'';if(chosen||!profile?.region)return baseLoadFeed();
    const min=Number(document.getElementById('minScore')?.value||0);const {data,error}=await client.rpc('get_local_opportunity_feed',{p_limit:500,p_min_score:min});
    if(error){document.getElementById('feed').innerHTML='<div class="empty">Erreur : '+esc(error.message)+'</div>';toast('Impossible de charger le radar local : '+error.message,'err');return}
    feed=data||[];renderFeed();renderDealDay();updateStats();
    const firstFive=feed.slice(0,5),dept=profile.department,reg=profile.region,sameDept=firstFive.filter(x=>dept&&x.department===dept).length,sameRegion=firstFive.filter(x=>x.region===reg).length;
    let detail='5 opportunités prioritaires sont affichées.';if(feed.length<5)detail=feed.length+' opportunité'+(feed.length>1?'s':'')+' disponible'+(feed.length>1?'s':'')+' actuellement.';else if(sameDept>=5)detail='Les 5 premières sont dans votre département.';else if(sameRegion>=5)detail='Les 5 premières sont dans votre région.';else detail=sameRegion+' dans votre région, puis élargissement automatique pour compléter les 5.';
    renderGeo('Zone : <b>'+esc(reg)+'</b>'+(dept?' · département '+esc(dept):'')+'. '+detail,true);
  };

  window.loadPipeline=async()=>{if(!session?.user?.id)return;const {data,error}=await client.rpc('get_my_pipeline');if(error){toast('Impossible de charger le pipeline : '+error.message,'err');return}pipeline=data||[];renderPipeline();updateStats()};
  window.addPipeline=async id=>{if(!session?.user?.id){toast('Connectez-vous pour utiliser le pipeline.','err');return}toast('Ajout au pipeline…','info');const {error}=await client.from('pipeline').upsert({user_id:session.user.id,opportunity_id:id,status:'to_qualify'},{onConflict:'user_id,opportunity_id',ignoreDuplicates:true});if(error){toast('Ajout impossible : '+error.message,'err');return}await window.loadPipeline();toast('✓ Opportunité ajoutée au pipeline.')};
  window.updatePipe=async(id,status)=>{const {error}=await client.from('pipeline').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error){toast('Mise à jour impossible : '+error.message,'err');return}await window.loadPipeline();toast('✓ Statut du pipeline mis à jour.')};
  window.removePipe=async id=>{const {error}=await client.from('pipeline').delete().eq('id',id);if(error){toast('Retrait impossible : '+error.message,'err');return}await window.loadPipeline();toast('Opportunité retirée du pipeline.')};
  window.startCheckout=plan=>{if(!session?.user?.id){toast('Connectez-vous d’abord pour activer votre abonnement.','err');scrollToAuth();return}const base=CHECKOUT?.[plan];if(!base){toast('Lien de paiement indisponible pour cette formule.','err');return}toast('Ouverture du paiement Stripe sécurisé…','info');const sep=base.includes('?')?'&':'?';setTimeout(()=>{location.href=base+sep+'client_reference_id='+encodeURIComponent(session.user.id)+'&prefilled_email='+encodeURIComponent(session.user.email)},180)};

  function enhanceFree(){
    const badge=document.getElementById('planBadge'),isFree=badge&&/Gratuit/i.test(badge.textContent||''),feedEl=document.getElementById('feed');if(!feedEl)return;let banner=document.getElementById('sdFreeBanner');
    if(isFree){
      if(!banner){banner=document.createElement('div');banner.id='sdFreeBanner';banner.className='sd-free-banner';banner.innerHTML='<b>APERÇU GRATUIT</b> — ZoneProspect 360 vous montre 5 besoins commerciaux prioritaires. L’acheteur, l’objet exact, la source officielle et l’échéance restent verrouillés. <strong>Déblocage dès 9,90 €/mois.</strong>';feedEl.parentNode.insertBefore(banner,feedEl)}
      document.querySelectorAll('#feed .card').forEach(card=>{
        const tags=card.querySelector('.tagrow');if(tags&&!tags.querySelector('.sd-preview')){const t=document.createElement('span');t.className='tag sd-preview';t.textContent='APERÇU GRATUIT';tags.prepend(t)}
        const signalBox=card.querySelector('.signal');if(signalBox){const b=signalBox.querySelector('b');if(b)b.textContent='Besoin détecté :';const id=(card.id||'').replace(/^card-/,'');let o=null;try{o=feed.find(x=>String(x.id)===id)}catch(e){}if(o?.signal&&!card.querySelector('.sd-value')){const v=document.createElement('div');v.className='sd-value';v.innerHTML='<b>Potentiel commercial</b><br>'+esc(o.signal);signalBox.insertAdjacentElement('afterend',v)}}
        card.querySelectorAll('button').forEach(btn=>{if((btn.textContent||'').includes('🔒 Source')){btn.textContent='🔒 Voir l’acheteur, l’objet exact et la source — 9,90 €';btn.classList.add('primary','sd-unlock')}})
      });
    }else{if(banner)banner.remove();document.querySelectorAll('.sd-preview,.sd-value').forEach(x=>x.remove())}
  }

  async function init(){if(!session?.user?.id||initUser===session.user.id)return;initUser=session.user.id;profile=await readProfile()||{};ensurePersonal();renderBiz(profile.commercial_specialties||[]);if(profile.region){renderGeo('Zone enregistrée : <b>'+esc(profile.region)+'</b>'+(profile.department?' · département '+esc(profile.department):'')+'.',true);const r=document.getElementById('region');if(r&&!r.value)await window.loadFeed()}else renderGeo('Activez votre position pour recevoir en priorité <b>au moins 5 opportunités adaptées à votre zone</b>.')}

  const obs=new MutationObserver(()=>{enhanceFree();if(session?.user?.id&&document.getElementById('dashboard')?.classList.contains('show'))init()});obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  setInterval(()=>{enhanceFree();if(session?.user?.id)init()},1200);
})();