(()=>{
  if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined') return;

  const previousProAccount=window.proAccount||proAccount;
  const previousViewBusiness=window.viewBusiness||viewBusiness;
  const previousBusinessCard=window.businessCard||businessCard;

  const DAYS=[['mon','Lundi'],['tue','Mardi'],['wed','Mercredi'],['thu','Jeudi'],['fri','Vendredi'],['sat','Samedi'],['sun','Dimanche']];
  const RADII=[1,5,10,20,50];
  const CATEGORIES=['Artisan / bâtiment','Automobile','Beauté / coiffure','Commerce','Conseil / services','Cuisine / chef à domicile','Événementiel','Hébergement','Maison / décoration','Photographie / vidéo','Restaurant / alimentation','Santé / bien-être','Sport / loisirs','Transport / livraison','Autre'];

  const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const byId=id=>document.getElementById(id);
  const owned=id=>(S.myBusinesses||[]).find(b=>b.id===id&&S.session&&b.owner_id===S.session.user.id);
  const cleanUrl=v=>{let s=String(v||'').trim();if(!s)return null;if(!/^https?:\/\//i.test(s))s='https://'+s;return s};
  const cleanPhone=v=>String(v||'').trim()||null;
  const cleanSiret=v=>String(v||'').replace(/\D/g,'');
  const audienceText=v=>v==='individuals'?'Particuliers':v==='professionals'?'Professionnels':'Particuliers + professionnels';
  const modeText=v=>v==='mobile'?'Professionnel mobile':v==='both'?'Établissement + interventions':'Établissement';
  const publicArea=b=>b?.service_area_label||`Basé à ${b?.city||'Issoire'} — intervient jusqu’à ${Number(b?.visibility_radius_km||20)} km`;
  const legalLocked=b=>!!(b?.siret&&(b?.is_claimed||b?.source==='sirene_officiel'));

  function completeness(b){
    const checks=[
      ['nom',b?.name],['activité',b?.category],['description',b?.description],['téléphone',b?.phone],
      ['email',b?.contact_email],['ville',b?.city],['zone',b?.service_area_label||b?.address],
      ['clientèle',b?.customer_audience],['logo',b?.logo_url],['horaires',Object.keys(b?.opening_hours||{}).length]
    ];
    const done=checks.filter(([,v])=>!!v).length;
    return {percent:Math.round(done/checks.length*100),missing:checks.filter(([,v])=>!v).map(([k])=>k)};
  }

  function hoursHtml(hours={}){
    return DAYS.map(([key,label])=>`<div class="two"><div><label>${label}</label></div><div><input id="icco_h_${key}" maxlength="100" value="${e(hours[key]||'')}" placeholder="09:00–12:00 / 14:00–18:00 ou Fermé"></div></div>`).join('');
  }

  function categoryOptions(current=''){
    const has=current&&CATEGORIES.includes(current);
    return `${current&&!has?`<option value="${e(current)}" selected>${e(current)}</option>`:''}${CATEGORIES.map(c=>`<option value="${e(c)}" ${current===c?'selected':''}>${e(c)}</option>`).join('')}`;
  }

  function editorHtml(b,isNew){
    const c=completeness(b||{});
    const locked=legalLocked(b);
    const hours=b?.opening_hours||{};
    return `
      <div style="max-width:900px;margin:auto">
        <div class="row between" style="gap:12px;align-items:flex-start">
          <div>
            <span class="pill">V40 · FICHE ENTREPRISE</span>
            <h2 style="margin:8px 0 4px">${isNew?'➕ Créer ma fiche professionnelle':'🏪 Modifier mon entreprise'}</h2>
            <p class="muted">Les informations enregistrées alimentent votre fiche publique, l’annuaire et le Radar Issoire Connect.</p>
          </div>
          ${!isNew?`<button class="btn" onclick="closeModal();viewBusiness('${e(b.id)}')">👁 Aperçu public</button>`:''}
        </div>

        ${!isNew?`<div class="notice" style="margin:12px 0"><div class="row between"><b>Fiche complétée</b><strong>${c.percent} %</strong></div><div style="height:9px;background:#e7edf5;border-radius:20px;overflow:hidden;margin:7px 0"><div style="height:100%;width:${c.percent}%;background:linear-gradient(90deg,#0877eb,#ff8318)"></div></div>${c.missing.length?`<small>À compléter : ${c.missing.slice(0,5).map(e).join(', ')}.</small>`:'<small>Votre fiche contient les informations essentielles.</small>'}</div>`:''}

        <div class="form">
          <h3>1. Identité</h3>
          <label>Nom commercial *</label>
          <input id="icco_name" maxlength="160" value="${e(b?.name||'')}" placeholder="Ex. Chef Marco à domicile">

          <label>Raison sociale / nom légal</label>
          <input id="icco_legal" maxlength="200" value="${e(b?.legal_name||'')}" placeholder="Ex. Jean Dupont EI">

          <label>Slogan</label>
          <input id="icco_tagline" maxlength="180" value="${e(b?.tagline||'')}" placeholder="Ex. Votre chef pour vos soirées privées et professionnelles">

          <div class="two">
            <div><label>Activité principale *</label><select id="icco_category">${categoryOptions(b?.category||'')}</select></div>
            <div><label>Clientèle</label><select id="icco_audience"><option value="both" ${!b?.customer_audience||b.customer_audience==='both'?'selected':''}>Particuliers + professionnels</option><option value="individuals" ${b?.customer_audience==='individuals'?'selected':''}>Particuliers</option><option value="professionals" ${b?.customer_audience==='professionals'?'selected':''}>Professionnels</option></select></div>
          </div>

          <label>Description de l’activité *</label>
          <textarea id="icco_description" rows="6" maxlength="3000" placeholder="Présentez clairement votre activité, vos spécialités et les prestations que vous proposez.">${e(b?.description||'')}</textarea>

          <h3>2. Informations légales</h3>
          ${locked?`<div class="notice">🔒 <b>SIRET vérifié : ${e(b.siret)}</b>${b.siren?` · SIREN ${e(b.siren)}`:''}<br><small>Cette identité vient de la fiche officielle/revendiquée et n’est pas modifiable ici.</small></div>`:`<label>SIRET</label><input id="icco_siret" inputmode="numeric" maxlength="18" value="${e(b?.siret||'')}" placeholder="14 chiffres"><small class="muted">Facultatif lors de la création. Un SIRET renseigné pourra ensuite être vérifié.</small>`}

          <h3>3. Contact</h3>
          <label>Personne à contacter</label>
          <input id="icco_contact_name" maxlength="160" value="${e(b?.contact_name||'')}" placeholder="Nom du responsable">
          <div class="two">
            <div><label>Téléphone professionnel</label><input id="icco_phone" type="tel" maxlength="30" value="${e(b?.phone||'')}"></div>
            <div><label>Email professionnel</label><input id="icco_email" type="email" maxlength="220" value="${e(b?.contact_email||'')}"></div>
          </div>
          <div class="two">
            <div><label>Site internet</label><input id="icco_website" value="${e(b?.website||'')}" placeholder="https://..."></div>
            <div><label>Réservation / rendez-vous</label><input id="icco_booking" value="${e(b?.booking_url||'')}" placeholder="https://..."></div>
          </div>

          <h3>4. Localisation et intervention</h3>
          <div class="two">
            <div><label>Mode d’activité</label><select id="icco_mode"><option value="establishment" ${!b?.business_mode||b.business_mode==='establishment'?'selected':''}>Établissement ouvert au public</option><option value="mobile" ${b?.business_mode==='mobile'?'selected':''}>Professionnel mobile / chez les clients</option><option value="both" ${b?.business_mode==='both'?'selected':''}>Établissement + déplacements</option></select></div>
            <div><label>Rayon d’intervention</label><select id="icco_radius">${RADII.map(r=>`<option value="${r}" ${Number(b?.visibility_radius_km||20)===r?'selected':''}>${r} km</option>`).join('')}</select></div>
          </div>
          <label>Adresse</label>
          <input id="icco_address" maxlength="250" value="${e(b?.address||'')}" placeholder="Adresse de l’établissement ou adresse administrative">
          <div class="two">
            <div><label>Ville</label><input id="icco_city" maxlength="120" value="${e(b?.city||'Issoire')}"></div>
            <div><label>Code postal</label><input id="icco_postal" maxlength="10" value="${e(b?.postal_code||'63500')}"></div>
          </div>
          <label>Zone affichée au public</label>
          <input id="icco_area" maxlength="180" value="${e(b?.service_area_label||'')}" placeholder="Ex. Basé à Issoire — intervient jusqu’à 20 km">
          <label style="display:flex;gap:9px;align-items:center"><input id="icco_show_address" type="checkbox" ${b?.show_public_address!==false?'checked':''}> Afficher mon adresse complète publiquement</label>
          <div class="notice"><small>Pour un auto-entrepreneur qui travaille depuis son domicile, l’adresse peut rester privée. Le public verra seulement la ville et la zone d’intervention.</small></div>

          <h3>5. Visuels et réseaux</h3>
          <div class="two"><div><label>Logo — URL</label><input id="icco_logo" value="${e(b?.logo_url||'')}" placeholder="https://..."></div><div><label>Photo de couverture — URL</label><input id="icco_cover" value="${e(b?.cover_image_url||'')}" placeholder="https://..."></div></div>
          <label>Facebook</label><input id="icco_facebook" value="${e(b?.facebook_url||'')}" placeholder="https://facebook.com/..."><label>Instagram</label><input id="icco_instagram" value="${e(b?.instagram_url||'')}" placeholder="https://instagram.com/..."><label>LinkedIn</label><input id="icco_linkedin" value="${e(b?.linkedin_url||'')}" placeholder="https://linkedin.com/..."></div>

          <h3>6. Horaires</h3>
          ${hoursHtml(hours)}

          <div class="actions" style="margin-top:18px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn brand" onclick="saveIcCompanyProfile('${isNew?'':e(b.id)}')">💾 ${isNew?'Créer ma fiche':'Enregistrer les modifications'}</button>
            <button class="btn" onclick="closeModal()">Annuler</button>
          </div>
        </div>
      </div>`;
  }

  window.openIcCompanyProfile=function(id=''){
    if(!S.session){if(typeof authModal==='function')authModal('account');else say('Connectez-vous pour créer votre fiche professionnelle.');return;}
    const b=id?owned(id):null;
    if(id&&!b)return say('Vous ne pouvez modifier que votre propre entreprise.');
    const draft=b||{name:'',category:'',description:'',city:S.profile?.city||'Issoire',postal_code:S.profile?.postal_code||'63500',visibility_radius_km:20,business_mode:'establishment',show_public_address:true,customer_audience:'both',opening_hours:{}};
    openModal(editorHtml(draft,!id));
  };

  window.openEditBusiness=id=>window.openIcCompanyProfile(id);

  window.saveIcCompanyProfile=async function(id=''){
    if(!S.session)return say('Connectez-vous.');
    const current=id?owned(id):null;
    if(id&&!current)return say('Accès refusé.');

    const name=byId('icco_name')?.value.trim()||'';
    const category=byId('icco_category')?.value.trim()||'';
    const description=byId('icco_description')?.value.trim()||'';
    if(name.length<2)return say('Indiquez le nom de votre entreprise.');
    if(category.length<2)return say('Choisissez votre activité principale.');
    if(description.length<15)return say('Ajoutez une courte description de votre activité.');

    const radius=Number(byId('icco_radius')?.value||20);
    if(!RADII.includes(radius))return say('Choisissez un rayon valide.');

    const email=byId('icco_email')?.value.trim()||'';
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return say('Vérifiez votre email professionnel.');

    const opening_hours={};
    for(const [key] of DAYS){const value=byId(`icco_h_${key}`)?.value.trim()||'';if(value)opening_hours[key]=value;}

    const mode=byId('icco_mode')?.value||'establishment';
    const city=byId('icco_city')?.value.trim()||'Issoire';
    const serviceArea=byId('icco_area')?.value.trim()||`Basé à ${city} — intervient jusqu’à ${radius} km`;

    const payload={
      name,
      legal_name:byId('icco_legal')?.value.trim()||null,
      tagline:byId('icco_tagline')?.value.trim()||null,
      category,
      description,
      customer_audience:byId('icco_audience')?.value||'both',
      contact_name:byId('icco_contact_name')?.value.trim()||null,
      phone:cleanPhone(byId('icco_phone')?.value),
      contact_email:email||null,
      website:cleanUrl(byId('icco_website')?.value),
      booking_url:cleanUrl(byId('icco_booking')?.value),
      business_mode:mode,
      visibility_radius_km:radius,
      address:byId('icco_address')?.value.trim()||null,
      city,
      postal_code:byId('icco_postal')?.value.trim()||null,
      service_area_label:serviceArea,
      show_public_address:!!byId('icco_show_address')?.checked,
      logo_url:cleanUrl(byId('icco_logo')?.value),
      cover_image_url:cleanUrl(byId('icco_cover')?.value),
      facebook_url:cleanUrl(byId('icco_facebook')?.value),
      instagram_url:cleanUrl(byId('icco_instagram')?.value),
      linkedin_url:cleanUrl(byId('icco_linkedin')?.value),
      opening_hours,
      search_keywords:[name,category,byId('icco_tagline')?.value,description,city,serviceArea].filter(Boolean).join(' '),
      updated_at:new Date().toISOString()
    };

    const siretInput=byId('icco_siret');
    if(siretInput&&(!current||!legalLocked(current))){
      const siret=cleanSiret(siretInput.value);
      if(siret&&siret.length!==14)return say('Le SIRET doit contenir 14 chiffres.');
      payload.siret=siret||null;
      payload.siren=siret?siret.slice(0,9):null;
    }

    let result;
    if(id){
      result=await sb.from('ic_businesses').update(payload).eq('id',id).eq('owner_id',S.session.user.id).select('*').single();
    }else{
      result=await sb.from('ic_businesses').insert({...payload,owner_id:S.session.user.id,source:'user',is_active:true}).select('*').single();
    }

    if(result.error)return say(result.error.message);
    const saved=result.data;
    if(id){
      Object.assign(current,saved);
      const pub=(S.businesses||[]).find(x=>x.id===id);if(pub)Object.assign(pub,saved);
    }else{
      S.myBusinesses=(S.myBusinesses||[]).concat(saved);
      S.businesses=(S.businesses||[]).concat(saved);
    }

    closeModal();
    say(id?'Fiche entreprise enregistrée.':'Votre fiche professionnelle est créée.');
    if(typeof refresh==='function')await refresh();
    if(typeof go==='function')go('account');
  };

  function companyCard(b){
    const c=completeness(b);
    const addressLine=b.show_public_address===false?publicArea(b):(b.address||publicArea(b));
    return `<article class="card" style="margin-bottom:12px">
      <div class="row between" style="gap:12px;align-items:flex-start">
        <div style="display:flex;gap:12px;align-items:center">
          ${b.logo_url?`<img src="${e(b.logo_url)}" alt="" style="width:58px;height:58px;object-fit:cover;border-radius:12px;border:1px solid #e2e8f0">`:'<div style="width:58px;height:58px;border-radius:12px;background:#eef5ff;display:grid;place-items:center;font-size:24px">🏪</div>'}
          <div><h3 style="margin:0 0 4px">${e(b.name)}</h3><div class="muted">${e(b.category||'Activité à compléter')}</div><span class="pill">${b.is_claimed?'✓ Fiche vérifiée':'Fiche professionnelle'}</span></div>
        </div>
        <div class="actions"><button class="btn brand" onclick="openIcCompanyProfile('${e(b.id)}')">✏️ Modifier</button><button class="btn" onclick="viewBusiness('${e(b.id)}')">👁 Aperçu</button></div>
      </div>
      <div style="margin-top:12px"><div class="row between"><small>Complétion</small><b>${c.percent} %</b></div><div style="height:8px;background:#e8eef5;border-radius:20px;overflow:hidden"><div style="height:100%;width:${c.percent}%;background:linear-gradient(90deg,#0877eb,#ff8318)"></div></div></div>
      <div class="muted" style="margin-top:10px">${e(modeText(b.business_mode))} · ${e(addressLine)}</div>
      <div class="muted">Clientèle : ${e(audienceText(b.customer_audience))}</div>
      ${b.phone?`<div>☎ ${e(b.phone)}</div>`:''}${b.contact_email?`<div>✉ ${e(b.contact_email)}</div>`:''}
    </article>`;
  }

  function managerHtml(){
    const businesses=S.myBusinesses||[];
    return `<section id="icCompanyManagerV40" style="margin-bottom:18px">
      <div class="sectionhead">
        <div><span class="pill">ESPACE PRO</span><h2 style="margin-top:7px">🏪 Mon établissement / mon entreprise</h2><p>Créez et gérez la fiche qui sera visible par les habitants et les autres professionnels.</p></div>
        <div class="actions"><button class="btn" onclick="go('businesses')">🔎 Rechercher une fiche existante</button><button class="btn brand" onclick="openIcCompanyProfile()">+ Créer ma fiche</button></div>
      </div>
      ${businesses.length?businesses.map(companyCard).join(''):`<div class="empty"><h3>Vous n’avez pas encore de fiche professionnelle</h3><p>Si votre entreprise existe déjà dans l’annuaire officiel, recherchez-la et revendiquez-la. Sinon, créez votre fiche.</p><div class="actions" style="justify-content:center"><button class="btn" onclick="go('businesses')">🔎 Rechercher mon entreprise</button><button class="btn brand" onclick="openIcCompanyProfile()">➕ Créer ma fiche professionnelle</button></div></div>`}
    </section>`;
  }

  window.proAccount=function(...args){
    const r=previousProAccount.apply(this,args);
    setTimeout(()=>{
      if(typeof main==='undefined'||!main)return;
      document.getElementById('icCompanyManagerV40')?.remove();
      main.insertAdjacentHTML('afterbegin',managerHtml());
    },0);
    return r;
  };

  window.businessCard=function(b){
    let html=previousBusinessCard(b);
    if(b?.tagline&&!html.includes(e(b.tagline)))html=html.replace('</h3>',`</h3><div class="muted" style="margin-top:4px">${e(b.tagline)}</div>`);
    return html;
  };

  window.viewBusiness=function(id){
    previousViewBusiness(id);
    const b=(S.businesses||[]).find(x=>x.id===id)||(S.myBusinesses||[]).find(x=>x.id===id);
    if(!b||typeof modalBody==='undefined'||!modalBody)return;
    const extra=[];
    if(b.customer_audience)extra.push(`<div><b>Clientèle :</b> ${e(audienceText(b.customer_audience))}</div>`);
    if(b.business_mode)extra.push(`<div><b>Mode :</b> ${e(modeText(b.business_mode))}</div>`);
    if(b.show_public_address===false)extra.push(`<div><b>Zone :</b> ${e(publicArea(b))}</div>`);
    if(b.siret)extra.push(`<div><b>SIRET :</b> ${e(b.siret)}</div>`);
    if(extra.length)modalBody.insertAdjacentHTML('beforeend',`<div class="notice" style="margin-top:12px">${extra.join('')}</div>`);
    if(b.booking_url)modalBody.insertAdjacentHTML('beforeend',`<div class="actions" style="margin-top:10px"><a class="btn brand" target="_blank" rel="noopener" href="${e(b.booking_url)}">📅 Réserver / prendre rendez-vous</a></div>`);
    const social=[['Facebook',b.facebook_url],['Instagram',b.instagram_url],['LinkedIn',b.linkedin_url]].filter(([,u])=>u);
    if(social.length)modalBody.insertAdjacentHTML('beforeend',`<div class="actions" style="margin-top:10px">${social.map(([n,u])=>`<a class="btn" target="_blank" rel="noopener" href="${e(u)}">${e(n)}</a>`).join('')}</div>`);
    if(owned(id))modalBody.insertAdjacentHTML('beforeend',`<div class="actions" style="margin-top:12px"><button class="btn brand" onclick="openIcCompanyProfile('${e(id)}')">✏️ Modifier ma fiche entreprise</button></div>`);
  };
})();
