
;/* ===== claim-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
S.claims=S.claims||[];S.adminClaims=S.adminClaims||[];
const _loadPrivate=loadPrivate,_accountPage=accountPage,_proAccount=proAccount,_businessCard=businessCard,_viewBusiness=viewBusiness;
loadPrivate=async function(){await _loadPrivate();if(!S.session){S.claims=[];S.adminClaims=[];return}const uid=S.session.user.id;const c=await sb.from('ic_business_claims').select('*').eq('claimant_id',uid).order('created_at',{ascending:false});S.claims=c.data||[];if(S.profile?.role==='admin'){const a=await sb.from('ic_business_claims').select('*').eq('status','pending').order('created_at',{ascending:true});S.adminClaims=a.data||[]}else S.adminClaims=[]};
function claimable(b){return b&&b.source==='sirene_officiel'&&!b.is_claimed&&!b.owner_id}
businessCard=function(b){let h=_businessCard(b);if(claimable(b))h=h.replace('</article>',`<div class="actions" style="margin-top:8px"><button class="btn" onclick="openClaimBusiness('${b.id}')">🏪 C’est mon entreprise</button></div></article>`);return h};
viewBusiness=function(id){_viewBusiness(id);const b=S.businesses.find(x=>x.id===id);if(claimable(b)&&modalBody){modalBody.insertAdjacentHTML('beforeend',`<div class="notice" style="margin-top:14px"><b>Fiche officielle non revendiquée</b><p>Vous représentez cet établissement ? Demandez à récupérer cette fiche après vérification.</p><button class="btn primary" onclick="openClaimBusiness('${id}')">🏪 C’est mon entreprise — Revendiquer</button></div>`)} };
window.openClaimBusiness=function(id){const b=S.businesses.find(x=>x.id===id);if(!b)return;if(!S.session){say('Connectez-vous ou créez un compte professionnel pour revendiquer cette fiche.');authModal('businesses');return}if(!claimable(b))return say('Cette fiche est déjà revendiquée.');const pending=S.claims.find(c=>c.business_id===id&&c.status==='pending');if(pending)return openModal(`<h2>Demande déjà envoyée</h2><p>Votre demande pour <b>${esc(b.name)}</b> est en cours de vérification.</p><div class="notice">Statut : <b>⏳ En attente</b></div><button class="btn brand" onclick="closeModal();go('account')">Voir mon espace professionnel</button>`);openModal(`<h2>🏪 Revendiquer ${esc(b.name)}</h2><p class="muted">La fiche ne sera transférée qu’après vérification.</p><div class="notice"><b>${esc(b.name)}</b><br>${esc(b.address||'')}${b.siret?`<br>SIRET : ${esc(b.siret)}`:''}</div><div class="form"><label>Nom et prénom</label><input id="claimName" value="${esc(S.profile?.display_name||'')}"><label>Votre fonction</label><input id="claimRole" placeholder="Gérant, dirigeant, responsable…"><label>Email de contact</label><input id="claimEmail" type="email" value="${esc(S.session.user.email||'')}"><label>Téléphone</label><input id="claimPhone" type="tel"><label>Justificatif / explication</label><textarea id="claimProof" rows="4" placeholder="Expliquez votre lien avec l’entreprise"></textarea><label>Lien justificatif (facultatif)</label><input id="claimUrl" type="url" placeholder="https://site-officiel.fr"><button class="btn primary" onclick="submitBusinessClaim('${id}')">Envoyer ma demande</button></div>`)};
window.submitBusinessClaim=async function(id){const args={p_business_id:id,p_full_name:$('#claimName').value.trim(),p_role_in_business:$('#claimRole').value.trim(),p_contact_email:$('#claimEmail').value.trim(),p_contact_phone:$('#claimPhone').value.trim()||null,p_proof_note:$('#claimProof').value.trim()||null,p_proof_url:$('#claimUrl').value.trim()||null};if(!args.p_full_name||!args.p_role_in_business||!args.p_contact_email)return say('Nom, fonction et email sont obligatoires.');const {error}=await sb.rpc('ic_submit_business_claim',args);if(error)return say(error.message);closeModal();say('Demande envoyée. Elle doit être validée avant le transfert de la fiche.');await loadPrivate();go('account')};
function st(v){return v==='approved'?'✅ Validée':v==='rejected'?'❌ Refusée':'⏳ En attente'}
function claimsHtml(){return S.claims.length?`<div class="cards">${S.claims.map(c=>{const b=S.businesses.find(x=>x.id===c.business_id);return `<div class="card"><span class="pill">${st(c.status)}</span><h3>${esc(b?.name||'Entreprise')}</h3><div class="muted">Demande du ${new Date(c.created_at).toLocaleDateString('fr-FR')}</div>${c.admin_note?`<p>${esc(c.admin_note)}</p>`:''}</div>`}).join('')}</div>`:'<div class="empty">Aucune demande de revendication.</div>'}
proAccount=function(){_proAccount();if(!S.myBusinesses.length){main.insertAdjacentHTML('afterbegin',`<div class="sectionhead"><div><h2>Retrouver mon entreprise</h2><p>Avant de créer une fiche, recherchez votre établissement dans l’annuaire officiel.</p></div><button class="btn brand" onclick="go('businesses')">🔎 Rechercher ma fiche</button></div>${S.claims.length?`<div class="sectionhead"><div><h2>Mes demandes de revendication</h2></div></div>${claimsHtml()}`:''}`)}};
accountPage=function(){if(S.session&&S.profile?.role==='admin')return adminAccount();return _accountPage()};
window.adminAccount=function(){main.innerHTML=`<div class="sectionhead"><div><h2>Administration Issoire Connect</h2><p>Validation des revendications d’entreprises.</p></div><button class="btn" onclick="logout()">Déconnexion</button></div><div class="kpis"><div class="kpi"><span class="muted">En attente</span><strong>${S.adminClaims.length}</strong></div><div class="kpi"><span class="muted">Professionnels</span><strong>${S.stats.pros}</strong></div></div><div class="sectionhead"><div><h2>Demandes à vérifier</h2></div></div>${S.adminClaims.length?S.adminClaims.map(adminClaimCard).join(''):'<div class="empty">Aucune demande en attente.</div>'}`};
window.adminClaimCard=function(c){const b=S.businesses.find(x=>x.id===c.business_id);return `<div class="card" style="margin-bottom:10px"><span class="pill">⏳ À vérifier</span><h3>${esc(b?.name||'Entreprise')}</h3><div class="muted">${esc(b?.address||'')}${b?.siret?` · SIRET ${esc(b.siret)}`:''}</div><p><b>Demandeur :</b> ${esc(c.full_name)} — ${esc(c.role_in_business)}<br><b>Email :</b> ${esc(c.contact_email)}${c.contact_phone?`<br><b>Tél. :</b> ${esc(c.contact_phone)}`:''}</p>${c.proof_note?`<div class="notice"><b>Justification :</b><br>${esc(c.proof_note)}</div>`:''}${c.proof_url?`<p><a class="btn" href="${esc(c.proof_url)}" target="_blank" rel="noopener">Ouvrir le justificatif</a></p>`:''}<div class="actions"><button class="btn green" onclick="reviewClaim('${c.id}','approved')">✅ Valider</button><button class="btn" onclick="reviewClaim('${c.id}','rejected')">❌ Refuser</button></div></div>`};
window.reviewClaim=function(id,status){openModal(`<h2>${status==='approved'?'Valider la revendication':'Refuser la revendication'}</h2><p>${status==='approved'?'La fiche sera transférée au compte du demandeur.':'La fiche restera non revendiquée.'}</p><div class="form"><label>Note administrative (facultatif)</label><textarea id="reviewNote" rows="4"></textarea><button class="btn ${status==='approved'?'green':'primary'}" onclick="confirmReviewClaim('${id}','${status}')">Confirmer</button></div>`)};
window.confirmReviewClaim=async function(id,status){const {error}=await sb.rpc('ic_review_business_claim',{p_claim_id:id,p_status:status,p_admin_note:$('#reviewNote').value.trim()||null});if(error)return say(error.message);closeModal();say(status==='approved'?'Fiche transférée au professionnel.':'Demande refusée.');await refresh()};
})();


;/* ===== pro-edit-patch.js ===== */
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


;/* ===== search-patch.js ===== */
(()=>{
if(typeof S==='undefined')return;
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const safe=(fn,fallback)=>{try{return fn()}catch(e){console.error('Issoire Connect render error',e);return fallback}};
const simpleBiz=b=>`<article class="card" onclick="viewBusiness('${String(b.id).replace(/'/g,"\\'")}')"><span class="pill">${typeof esc==='function'?esc(b.category||'Professionnel'):String(b.category||'Professionnel')}</span><h3>${typeof esc==='function'?esc(b.name||'Établissement'):String(b.name||'Établissement')}</h3><div class="muted">📍 ${typeof esc==='function'?esc(b.address||b.city||'Issoire'):String(b.address||b.city||'Issoire')}</div></article>`;
const renderBiz=b=>safe(()=>businessCard(b),simpleBiz(b));
const renderOther=(fn,x)=>safe(()=>fn(x),'');
window.runSearch=function(){
 const input=document.querySelector('#globalQ'),out=document.querySelector('#searchOut');
 if(!out)return;
 const q=norm(input?.value);
 if(!q){out.innerHTML='<div class="empty">Saisissez un commerce, un métier, un produit, un service ou un besoin.</div>';return}
 try{
  const base=typeof visibleBusinesses==='function'?visibleBusinesses():(S.businesses||[]);
  const bs=base.filter(b=>norm([b.name,b.category,b.description,b.search_keywords,b.address,b.city,b.postal_code,b.naf_code,b.siret].join(' ')).includes(q));
  const ps=(S.products||[]).filter(x=>norm([x.name,x.description,x.kind].join(' ')).includes(q));
  const os=(S.offers||[]).filter(x=>norm([x.title,x.description,x.offer_type].join(' ')).includes(q));
  const js=(S.jobs||[]).filter(x=>norm([x.title,x.description,x.contract_type,x.location].join(' ')).includes(q));
  const cs=(S.classifieds||[]).filter(x=>norm([x.title,x.description,x.category].join(' ')).includes(q));
  const es=(S.events||[]).filter(x=>norm([x.title,x.description,x.place].join(' ')).includes(q));
  const total=bs.length+ps.length+os.length+js.length+cs.length+es.length;
  const cards=[
   ...bs.slice(0,100).map(renderBiz),
   ...ps.slice(0,30).map(x=>renderOther(productCard,x)),
   ...os.slice(0,30).map(x=>renderOther(offerCard,x)),
   ...js.slice(0,30).map(x=>renderOther(jobCard,x)),
   ...cs.slice(0,30).map(x=>renderOther(classifiedCard,x)),
   ...es.slice(0,30).map(x=>renderOther(eventCard,x))
  ].filter(Boolean);
  out.innerHTML=`<div class="notice"><b>🔎 ${total} résultat${total>1?'s':''} pour « ${typeof esc==='function'?esc(input.value):input.value} »</b>${bs.length>100?`<div class="muted">Les 100 premiers établissements sont affichés. Affinez votre recherche pour en voir davantage.</div>`:''}</div>${cards.length?`<div class="cards" style="margin-top:12px">${cards.join('')}</div>`:'<div class="empty">Aucun résultat. Essayez un métier comme boulangerie, garage, coiffeur, médecin ou assurance.</div>'}`;
 }catch(e){console.error('Issoire Connect search error',e);out.innerHTML='<div class="empty">La recherche a rencontré un problème. Réessayez ou changez de terme.</div>'}
};
document.addEventListener('input',e=>{if(e.target&&e.target.id==='globalQ')window.runSearch()});
document.addEventListener('keydown',e=>{if(e.target&&e.target.id==='globalQ'&&e.key==='Enter'){e.preventDefault();window.runSearch()}});
})();


;/* ===== admin-full-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const A={tab:'businesses',rows:[],query:'',loading:false};
const CFG={
 businesses:{table:'ic_businesses',label:'Entreprises',icon:'🏪',search:'name',title:r=>r.name||'Entreprise',sub:r=>`${r.category||''}${r.address?' · '+r.address:''}${r.plan?' · '+r.plan:''}`,active:true,fields:[['name','Nom','text'],['category','Catégorie','text'],['description','Description','textarea'],['address','Adresse','text'],['city','Ville','text'],['postal_code','Code postal','text'],['phone','Téléphone','text'],['contact_email','Email professionnel','email'],['website','Site internet','text'],['plan','Forfait','select',['free','essential','pro','proplus']],['visibility_radius_km','Rayon (km)','number'],['is_active','Fiche active','boolean'],['is_claimed','Fiche revendiquée','boolean']]},
 profiles:{table:'ic_profiles',label:'Utilisateurs',icon:'👤',search:'display_name',title:r=>r.display_name||'Utilisateur',sub:r=>`${r.role||'resident'}${r.city?' · '+r.city:''}`,fields:[['display_name','Nom affiché','text'],['role','Rôle','select',['resident','pro','admin']],['city','Ville','text'],['postal_code','Code postal','text'],['radius_km','Rayon utilisateur (km)','number']]},
 products:{table:'ic_products',label:'Produits / services',icon:'📦',search:'name',title:r=>r.name||'Produit / service',sub:r=>`${r.kind||''}${r.price!=null?' · '+r.price+' €':''}`,active:true,delete:true,fields:[['kind','Type','select',['product','service']],['name','Nom','text'],['description','Description','textarea'],['price','Prix','number'],['price_label','Libellé prix','text'],['image_url','Image URL','text'],['is_active','Actif','boolean']]},
 offers:{table:'ic_offers',label:'Offres / invendus',icon:'🏷️',search:'title',title:r=>r.title||'Offre',sub:r=>`${r.offer_type||''}${r.sale_price!=null?' · '+r.sale_price+' €':''}${r.quantity!=null?' · stock '+r.quantity:''}`,active:true,delete:true,fields:[['offer_type','Type','select',['promotion','invendu','destockage','derniere_minute']],['title','Titre','text'],['description','Description','textarea'],['original_price','Prix initial','number'],['sale_price','Prix réduit','number'],['quantity','Quantité','number'],['starts_at','Début','datetime'],['ends_at','Fin','datetime'],['pickup_deadline','Retrait avant','datetime'],['is_active','Active','boolean']]},
 jobs:{table:'ic_jobs',label:'Emplois',icon:'💼',search:'title',title:r=>r.title||'Emploi',sub:r=>`${r.contract_type||''}${r.location?' · '+r.location:''}`,active:true,delete:true,fields:[['title','Intitulé','text'],['contract_type','Contrat','text'],['description','Description','textarea'],['salary_text','Salaire','text'],['location','Lieu','text'],['is_active','Active','boolean']]},
 events:{table:'ic_events',label:'Événements',icon:'📅',search:'title',title:r=>r.title||'Événement',sub:r=>`${r.place||''}${r.starts_at?' · '+new Date(r.starts_at).toLocaleDateString('fr-FR'):''}`,active:true,delete:true,fields:[['title','Titre','text'],['description','Description','textarea'],['starts_at','Début','datetime'],['ends_at','Fin','datetime'],['place','Lieu','text'],['image_url','Image URL','text'],['is_active','Actif','boolean']]},
 classifieds:{table:'ic_classifieds',label:'Annonces',icon:'📣',search:'title',title:r=>r.title||'Annonce',sub:r=>`${r.kind||''}${r.city?' · '+r.city:''}${r.price!=null?' · '+r.price+' €':''}`,active:true,delete:true,fields:[['kind','Type','text'],['title','Titre','text'],['description','Description','textarea'],['price','Prix','number'],['price_label','Libellé prix','text'],['city','Ville','text'],['image_url','Image URL','text'],['is_active','Active','boolean']]},
 ads:{table:'ic_ad_campaigns',label:'Publicités',icon:'📢',search:'title',title:r=>r.title||'Campagne',sub:r=>`${r.duration_seconds||0}s · toutes les ${r.frequency_minutes||0} min`,active:true,delete:true,fields:[['title','Titre','text'],['image_url','Image URL','text'],['target_url','Lien cible','text'],['duration_seconds','Durée (sec.)','number'],['frequency_minutes','Fréquence (min.)','number'],['starts_at','Début','datetime'],['ends_at','Fin','datetime'],['is_active','Active','boolean']]},
 orders:{table:'ic_orders',label:'Commandes',icon:'🧾',search:'status',title:r=>`Commande ${String(r.id||'').slice(0,8)}`,sub:r=>`${r.status||''}${r.order_type?' · '+r.order_type:''}${r.total!=null?' · '+r.total+' €':''}`,fields:[['status','Statut','select',['pending','confirmed','ready','completed','cancelled']],['total','Total','number'],['note','Note','textarea']]},
 claims:{table:'ic_business_claims',label:'Revendications',icon:'✅',search:'full_name',title:r=>r.full_name||'Demande',sub:r=>`${r.status||'pending'}${r.contact_email?' · '+r.contact_email:''}`,fields:[]},
 subscriptions:{table:'ic_subscriptions',label:'Abonnements',icon:'💳',search:'plan',title:r=>`Abonnement ${r.plan||''}`,sub:r=>`${r.status||''}${r.current_period_end?' · jusqu’au '+new Date(r.current_period_end).toLocaleDateString('fr-FR'):''}`,readonly:true,fields:[]}
};
function ok(){return !!(S.session&&S.profile?.role==='admin')}
function e(v){return esc(String(v??''))}
function dt(v){if(!v)return '';try{return new Date(v).toISOString().slice(0,16)}catch{return ''}}
function nav(){return `<div class="actions" style="gap:6px;flex-wrap:wrap">${Object.entries(CFG).map(([k,c])=>`<button class="btn ${A.tab===k?'brand':''}" onclick="adminLoadTab('${k}')">${c.icon} ${c.label}</button>`).join('')}</div>`}
window.adminAccount=function(){if(!ok())return go('account');main.innerHTML=`<div class="sectionhead"><div><span class="pill">👑 ADMINISTRATEUR</span><h2 style="margin-top:8px">Administration complète Issoire Connect</h2><p>Corrige les contenus du site sans modifier les règles normales des clients.</p></div><button class="btn" onclick="logout()">Déconnexion</button></div><div class="notice"><b>Accès administrateur activé.</b> Ton propre rôle admin est protégé contre une suppression accidentelle. Les abonnements Stripe sont consultables mais restent pilotés par Stripe.</div>${nav()}<div style="display:flex;gap:8px;margin:14px 0"><input id="adminSearch" style="flex:1" placeholder="Rechercher dans ${e(CFG[A.tab].label)}" value="${e(A.query)}" onkeydown="if(event.key==='Enter')adminSearchNow()"><button class="btn brand" onclick="adminSearchNow()">🔎 Rechercher</button></div><div id="adminList"><div class="empty">Chargement…</div></div>`;adminLoadTab(A.tab,A.query,true)};
window.adminSearchNow=function(){const q=(document.getElementById('adminSearch')?.value||'').trim();adminLoadTab(A.tab,q,true)};
window.adminLoadTab=async function(tab,q='',keepShell=false){if(!ok())return say('Accès administrateur requis.');A.tab=tab;A.query=q||'';const c=CFG[tab];if(!keepShell){adminAccount();return}const host=document.getElementById('adminList');if(host)host.innerHTML='<div class="empty">Chargement…</div>';let req=sb.from(c.table).select('*').limit(tab==='businesses'?100:80);if(A.query&&c.search)req=req.ilike(c.search,`%${A.query.replace(/[%_]/g,' ')}%`);if(tab!=='subscriptions'&&tab!=='profiles')req=req.order('created_at',{ascending:false});else if(tab==='profiles')req=req.order('created_at',{ascending:false});const {data,error}=await req;if(error){if(host)host.innerHTML=`<div class="notice">Erreur : ${e(error.message)}</div>`;return}A.rows=data||[];renderAdminRows()};
function renderAdminRows(){const host=document.getElementById('adminList');if(!host)return;const c=CFG[A.tab];if(!A.rows.length){host.innerHTML='<div class="empty">Aucun résultat.</div>';return}host.innerHTML=`<div class="sectionhead"><div><h2>${c.icon} ${c.label}</h2><p>${A.rows.length} résultat(s) affiché(s)</p></div></div><div class="cards">${A.rows.map(r=>adminCard(c,r)).join('')}</div>`}
function adminCard(c,r){const id=r.id||r.user_id;const self=A.tab==='profiles'&&S.session?.user?.id===r.id;const status=('is_active'in r)?`<span class="pill">${r.is_active?'🟢 Actif':'⚪ Inactif'}</span>`:'';const meta=A.tab==='businesses'?`<div class="muted">SIRET ${e(r.siret||'—')} · ${r.is_claimed?'✓ revendiquée':'non revendiquée'}</div>`:'';let actions='';if(A.tab==='claims'&&r.status==='pending'){actions=`<button class="btn green" onclick="reviewClaim('${r.id}','approved')">✅ Valider</button><button class="btn" onclick="reviewClaim('${r.id}','rejected')">❌ Refuser</button>`}else if(!c.readonly&&c.fields.length){actions=`<button class="btn brand" onclick="adminOpenEdit('${e(id)}')">✏️ Modifier</button>`;if(c.active)actions+=`<button class="btn" onclick="adminToggleActive('${e(id)}',${!!r.is_active})">${r.is_active?'⏸ Désactiver':'▶ Activer'}</button>`;if(c.delete)actions+=`<button class="btn" onclick="adminAskDelete('${e(id)}')">🗑 Supprimer</button>`}return `<article class="card"><div class="row between"><div><h3>${e(c.title(r))}${self?' <span class="pill">TON COMPTE</span>':''}</h3>${status}</div></div>${meta}<div class="muted">${e(c.sub(r))}</div><div class="actions" style="margin-top:10px">${actions||'<span class="muted">Consultation uniquement</span>'}</div></article>`}
function rowById(id){return A.rows.find(r=>String(r.id||r.user_id)===String(id))}
function control(f,r){const [k,l,t,opts]=f;const v=r[k];const selfRole=A.tab==='profiles'&&k==='role'&&S.session?.user?.id===r.id;if(t==='textarea')return `<label>${e(l)}</label><textarea id="af_${k}" rows="4">${e(v)}</textarea>`;if(t==='boolean')return `<label><input id="af_${k}" type="checkbox" ${v?'checked':''}> ${e(l)}</label>`;if(t==='select')return `<label>${e(l)}</label><select id="af_${k}" ${selfRole?'disabled':''}>${opts.map(o=>`<option value="${e(o)}" ${String(v)===o?'selected':''}>${e(o)}</option>`).join('')}</select>${selfRole?'<small class="muted">Ton propre rôle admin est verrouillé.</small>':''}`;return `<label>${e(l)}</label><input id="af_${k}" type="${t==='datetime'?'datetime-local':t}" value="${e(t==='datetime'?dt(v):v)}" ${t==='number'?'step="any"':''}>`}
window.adminOpenEdit=function(id){if(!ok())return;const c=CFG[A.tab],r=rowById(id);if(!r||c.readonly)return;openModal(`<h2>${c.icon} Modifier</h2><p class="muted">${e(c.title(r))}</p><div class="form">${c.fields.map(f=>control(f,r)).join('')}<button class="btn brand" onclick="adminSave('${e(id)}')">💾 Enregistrer les corrections</button></div>`)};
window.adminSave=async function(id){if(!ok())return;const c=CFG[A.tab],r=rowById(id);if(!r)return;const payload={};for(const [k,l,t] of c.fields){if(A.tab==='profiles'&&k==='role'&&S.session?.user?.id===r.id)continue;const el=document.getElementById('af_'+k);if(!el)continue;if(t==='boolean')payload[k]=!!el.checked;else if(t==='number')payload[k]=el.value===''?null:Number(el.value);else if(t==='datetime')payload[k]=el.value?new Date(el.value).toISOString():null;else payload[k]=el.value.trim()===''?null:el.value.trim()}if('updated_at'in r)payload.updated_at=new Date().toISOString();const key=r.id?'id':'user_id';const {error}=await sb.from(c.table).update(payload).eq(key,id);if(error)return say(error.message);closeModal();say('Correction enregistrée.');await adminLoadTab(A.tab,A.query,true);if(A.tab==='businesses')try{await refresh()}catch{}}
window.adminToggleActive=async function(id,current){if(!ok())return;const c=CFG[A.tab],r=rowById(id);if(!r)return;const {error}=await sb.from(c.table).update({is_active:!current}).eq('id',id);if(error)return say(error.message);say(!current?'Contenu activé.':'Contenu désactivé.');await adminLoadTab(A.tab,A.query,true)};
window.adminAskDelete=function(id){const c=CFG[A.tab],r=rowById(id);if(!r||!c.delete)return;openModal(`<h2>🗑 Supprimer définitivement ?</h2><p><b>${e(c.title(r))}</b></p><div class="notice">Cette action supprime ce contenu de la base. Pour une entreprise, un utilisateur, une commande ou un abonnement, la suppression directe n’est pas proposée ici.</div><div class="actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="adminDelete('${e(id)}')">Supprimer</button></div>`)};
window.adminDelete=async function(id){if(!ok())return;const c=CFG[A.tab];if(!c.delete)return;const {error}=await sb.from(c.table).delete().eq('id',id);if(error)return say(error.message);closeModal();say('Contenu supprimé.');await adminLoadTab(A.tab,A.query,true)};
})();


;/* ===== admin-business-extra-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined'||typeof adminOpenEdit!=='function'||typeof adminSave!=='function')return;
const DAYS=[['mon','Lundi'],['tue','Mardi'],['wed','Mercredi'],['thu','Jeudi'],['fri','Vendredi'],['sat','Samedi'],['sun','Dimanche']];
const _adminOpenEdit=adminOpenEdit;
const _adminSave=adminSave;
function e(v){return typeof esc==='function'?esc(String(v??'')):String(v??'')}
function val(id){return document.getElementById(id)?.value??''}
function nullable(v){const s=String(v??'').trim();return s===''?null:s}
function nullableNumber(v){const s=String(v??'').trim();if(s==='')return null;const n=Number(s);return Number.isFinite(n)?n:null}
window.adminOpenEdit=async function(id){
 _adminOpenEdit(id);
 // Ces champs n'existent que dans le formulaire Entreprises du panneau admin.
 if(!document.getElementById('af_visibility_radius_km')||!document.getElementById('af_is_claimed'))return;
 const {data,error}=await sb.from('ic_businesses').select('id,siret,latitude,longitude,opening_hours').eq('id',id).single();
 if(error)return say(error.message);
 const h=data?.opening_hours&&typeof data.opening_hours==='object'?data.opening_hours:{};
 const saveBtn=[...document.querySelectorAll('#modalBody button')].find(b=>/Enregistrer les corrections/i.test(b.textContent||''));
 if(!saveBtn)return;
 const block=document.createElement('div');
 block.id='adminBusinessExtra';
 block.innerHTML=`<div class="notice"><b>🇫🇷 Identifiant officiel</b><br>SIRET : ${e(data?.siret||'—')} · Le SIRET reste protégé et n’est pas modifiable depuis l’interface.</div><h3>📍 Position GPS</h3><div class="two"><div><label>Latitude</label><input id="af_latitude" type="number" step="any" value="${e(data?.latitude??'')}"></div><div><label>Longitude</label><input id="af_longitude" type="number" step="any" value="${e(data?.longitude??'')}"></div></div><div class="muted">Ces coordonnées déterminent la position de la fiche sur « Autour de moi » et le calcul des distances.</div><h3 style="margin-top:14px">🕒 Horaires d’ouverture</h3>${DAYS.map(([k,l])=>`<label>${l}</label><input id="afx_${k}" placeholder="09:00–12:00 / 14:00–18:00 ou Fermé" value="${e(h[k]||'')}">`).join('')}`;
 saveBtn.parentNode.insertBefore(block,saveBtn);
};
window.adminSave=async function(id){
 if(!document.getElementById('adminBusinessExtra'))return _adminSave(id);
 if(!S.session||S.profile?.role!=='admin')return say('Accès administrateur requis.');
 const latitude=nullableNumber(val('af_latitude')),longitude=nullableNumber(val('af_longitude'));
 if(latitude!==null&&(latitude<-90||latitude>90))return say('Latitude invalide : valeur attendue entre -90 et 90.');
 if(longitude!==null&&(longitude<-180||longitude>180))return say('Longitude invalide : valeur attendue entre -180 et 180.');
 const opening_hours={};for(const [k] of DAYS){const v=String(val('afx_'+k)).trim();if(v)opening_hours[k]=v}
 let website=nullable(val('af_website'));if(website&&!/^https?:\/\//i.test(website))website='https://'+website;
 const payload={
  name:nullable(val('af_name')),
  category:nullable(val('af_category')),
  description:nullable(val('af_description')),
  address:nullable(val('af_address')),
  city:nullable(val('af_city')),
  postal_code:nullable(val('af_postal_code')),
  phone:nullable(val('af_phone')),
  contact_email:nullable(val('af_contact_email')),
  website,
  plan:nullable(val('af_plan')),
  visibility_radius_km:nullableNumber(val('af_visibility_radius_km')),
  is_active:!!document.getElementById('af_is_active')?.checked,
  is_claimed:!!document.getElementById('af_is_claimed')?.checked,
  latitude,longitude,opening_hours,
  updated_at:new Date().toISOString()
 };
 if(!payload.name)return say('Le nom de l’entreprise est obligatoire.');
 const saveBtn=[...document.querySelectorAll('#modalBody button')].find(b=>/Enregistrer les corrections/i.test(b.textContent||''));
 if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='💾 Enregistrement…'}
 const {error}=await sb.from('ic_businesses').update(payload).eq('id',id);
 if(error){if(saveBtn){saveBtn.disabled=false;saveBtn.textContent='💾 Enregistrer les corrections'}return say(error.message)}
 closeModal();say('Fiche entreprise corrigée.');
 try{if(typeof refresh==='function')await refresh()}catch{}
 if(typeof adminAccount==='function')adminAccount();
};
})();


;/* ===== leaflet-safety-patch.js ===== */
(()=>{
let patched=false;
function patch(){
 if(patched||!window.L||!L.Map||!L.map)return;
 patched=true;
 const originalMap=L.map;
 L.map=function(target,options={}){
   return originalMap.call(L,target,{zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,inertia:false,...options});
 };
 const originalRemove=L.Map.prototype.remove;
 L.Map.prototype.remove=function(){
   try{if(this._panAnim)this._panAnim.stop();}catch{}
   try{if(this._flyToFrame)cancelAnimationFrame(this._flyToFrame);}catch{}
   try{this._stop();}catch{}
   try{this.stop();}catch{}
   return originalRemove.call(this);
 };
}
patch();
document.addEventListener('load',ev=>{
 const el=ev.target;
 if(el&&el.tagName==='SCRIPT'&&/leaflet/i.test(el.src||''))patch();
},true);
})();


;/* ===== directory-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const D={category:'Toutes',job:'',distance:0,openNow:false,geo:null,map:null,nearby:false,rows:[],loaded:false,loading:null};
const CATS=['Toutes','Alimentation & restaurants','Santé','Auto & mobilité','Maison & travaux','Beauté','Services & assurances','Commerces','Loisirs & sport','Hébergement','Autres'];
const _goDirectory=go,_businessCardDirectory=businessCard,_viewBusinessDirectory=viewBusiness;
function e(v){return esc(String(v??''))}
function fold(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function textOf(b){return fold([b.name,b.category,b.description,b.search_keywords,b.naf_code,b.address].filter(Boolean).join(' '))}
function categoryOf(b){
 const t=textOf(b);
 if(/boulanger|patisser|boucher|charcut|epicer|aliment|restaurant|brasserie|cafe|bar\b|bio\b|fromag|traiteur/.test(t))return 'Alimentation & restaurants';
 if(/medec|pharmac|dentist|infirm|kine|sante|hopital|clinique|opticien|orthophon|sage.femme|veterin/.test(t))return 'Santé';
 if(/garage|automobil|voiture|moto|cycle|velo|taxi|transport|carross|controle technique/.test(t))return 'Auto & mobilité';
 if(/plomb|electric|batiment|macon|menuis|peint|chauffag|clim|toitur|charpent|travaux|renov|jardin|paysag/.test(t))return 'Maison & travaux';
 if(/coiff|estheti|beaute|ongl|spa\b|massage|parfum/.test(t))return 'Beauté';
 if(/assur|banque|comptab|avocat|notair|imprimer|informat|agence|conseil|consult|communication|immobil/.test(t))return 'Services & assurances';
 if(/hotel|hebergement|camping|gite|chambre d.hote/.test(t))return 'Hébergement';
 if(/sport|fitness|gym|loisir|cinema|theatre|culture|danse|musique|jeu|association/.test(t))return 'Loisirs & sport';
 if(/magasin|boutique|commerce|vetement|chauss|fleur|bijou|librair|meuble|electromenag|optique/.test(t))return 'Commerces';
 return 'Autres';
}
async function ensureRows(force=false){
 if(D.loaded&&!force)return D.rows;
 if(D.loading&&!force)return D.loading;
 D.loading=(async()=>{
  const cols='id,name,category,description,address,city,postal_code,latitude,longitude,phone,website,plan,is_active,source,is_claimed,search_keywords,naf_code,opening_hours,visibility_radius_km';
  const all=[];const size=1000;
  for(let from=0;from<6000;from+=size){
   const {data,error}=await sb.from('ic_businesses').select(cols).eq('is_active',true).order('name',{ascending:true}).range(from,from+size-1);
   if(error)throw error;
   const batch=data||[];all.push(...batch);
   if(batch.length<size)break;
  }
  D.rows=all;D.loaded=true;return all;
 })();
 try{return await D.loading}finally{D.loading=null}
}
function residentGeo(){
 if(D.geo&&Number.isFinite(D.geo.lat)&&Number.isFinite(D.geo.lon))return D.geo;
 const candidates=[S.residentGeo,S.geo,S.location];
 for(const x of candidates){if(x){const lat=Number(x.lat??x.latitude),lon=Number(x.lon??x.lng??x.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon))return D.geo={lat,lon}}}
 try{const x=JSON.parse(localStorage.getItem('ic_resident_geo')||'null');if(x){const lat=Number(x.lat??x.latitude),lon=Number(x.lon??x.lng??x.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon))return D.geo={lat,lon}}}catch{}
 return null;
}
function km(a,b,c,d){const R=6371,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p;const q=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function distanceOf(b){const g=residentGeo(),lat=Number(b.latitude),lon=Number(b.longitude);return g&&Number.isFinite(lat)&&Number.isFinite(lon)?km(g.lat,g.lon,lat,lon):null}
function parisNow(){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
 const o={};for(const p of parts)o[p.type]=p.value;
 return {key:({Mon:'mon',Tue:'tue',Wed:'wed',Thu:'thu',Fri:'fri',Sat:'sat',Sun:'sun'})[o.weekday]||'mon',min:(Number(o.hour)%24)*60+Number(o.minute)};
}
function openState(b){
 const h=b?.opening_hours;if(!h||typeof h!=='object')return {known:false,open:false,label:'Horaires à compléter'};
 const n=parisNow(),raw=String(h[n.key]||'').trim();if(!raw)return {known:false,open:false,label:'Horaires à compléter'};
 if(/ferme|closed/.test(fold(raw)))return {known:true,open:false,label:'Fermé'};
 const pairs=[...raw.matchAll(/(\d{1,2})[:h](\d{2})\s*[-–—]\s*(\d{1,2})[:h](\d{2})/g)];
 if(!pairs.length)return {known:false,open:false,label:raw};
 for(const m of pairs){const a=Number(m[1])*60+Number(m[2]),z=Number(m[3])*60+Number(m[4]);if(n.min>=a&&n.min<z)return {known:true,open:true,label:'Ouvert maintenant'}}
 return {known:true,open:false,label:'Fermé maintenant'};
}
function safeUrl(v){if(!v)return null;try{const u=new URL(/^https?:\/\//i.test(v)?v:'https://'+v);return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}}
function routeUrl(b){const lat=Number(b.latitude),lon=Number(b.longitude);const dest=Number.isFinite(lat)&&Number.isFinite(lon)?`${lat},${lon}`:[b.address,b.postal_code,b.city].filter(Boolean).join(' ');return dest?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(dest):null}
function contactActions(b,detail=false){
 const phone=String(b.phone||'').replace(/[^\d+]/g,''),site=safeUrl(b.website),route=routeUrl(b);
 return `<div class="actions ic-contact-actions" style="margin-top:10px;gap:6px;flex-wrap:wrap">${detail?`<button class="btn brand" onclick="openDirectoryBusiness('${e(b.id)}')">Voir la fiche</button>`:''}${phone?`<a class="btn" href="tel:${e(phone)}">☎ Appeler</a>`:''}${site?`<a class="btn" href="${e(site)}" target="_blank" rel="noopener">🌐 Site</a>`:''}${route?`<a class="btn" href="${e(route)}" target="_blank" rel="noopener">🧭 Itinéraire</a>`:''}</div>`;
}
window.openDirectoryBusiness=function(id){const b=D.rows.find(x=>x.id===id);if(b&&!S.businesses.some(x=>x.id===id))S.businesses.push(b);viewBusiness(id)};
businessCard=function(b){let h=_businessCardDirectory(b);if(h.includes('ic-contact-actions'))return h;return h.replace('</article>',contactActions(b,false)+'</article>')};
viewBusiness=function(id){_viewBusinessDirectory(id);const b=S.businesses.find(x=>x.id===id)||D.rows.find(x=>x.id===id);if(b&&modalBody&&!modalBody.querySelector('.ic-directory-contact')){const d=distanceOf(b),o=openState(b);modalBody.insertAdjacentHTML('beforeend',`<div class="notice ic-directory-contact" style="margin-top:12px"><b>${o.open?'🟢':'🕒'} ${e(o.label)}</b>${d!=null?`<br>📍 ${d.toFixed(1)} km de vous`:''}${contactActions(b,false)}</div>`)}};
function filtered(){
 let rows=D.rows.filter(b=>b&&b.is_active!==false);
 const q=fold(D.job.trim());
 if(D.category!=='Toutes')rows=rows.filter(b=>categoryOf(b)===D.category);
 if(q)rows=rows.filter(b=>textOf(b).includes(q));
 if(D.openNow)rows=rows.filter(b=>openState(b).open);
 if(D.distance>0&&residentGeo())rows=rows.filter(b=>{const d=distanceOf(b);return d!=null&&d<=D.distance});
 rows.sort((a,b)=>{const da=distanceOf(a),db=distanceOf(b);if(da!=null&&db!=null)return da-db;if(da!=null)return -1;if(db!=null)return 1;return String(a.name||'').localeCompare(String(b.name||''),'fr')});
 return rows;
}
function directoryCard(b){
 const d=distanceOf(b),o=openState(b),cat=categoryOf(b);
 return `<article class="card"><div class="row between"><div><span class="pill">${e(cat)}</span><h3 style="margin-top:7px">${e(b.name||'Entreprise')}</h3></div><span class="pill">${o.open?'🟢 Ouvert':o.known?'🔴 Fermé':'🕒 Horaires ?'}</span></div><div class="muted">${e(b.category||'Activité locale')}${b.address?`<br>${e(b.address)}${b.postal_code?' · '+e(b.postal_code):''}${b.city?' '+e(b.city):''}`:''}${d!=null?`<br>📍 ${d.toFixed(1)} km`:''}</div>${contactActions(b,true)}</article>`;
}
function filtersHtml(){
 return `<div class="card" style="margin-bottom:12px"><div class="two"><div><label>Métier / besoin</label><input id="dirJob" value="${e(D.job)}" placeholder="boulangerie, garage, médecin…"></div><div><label>Distance</label><select id="dirDistance"><option value="0">Toutes distances</option>${[1,2,5,10,20,50].map(x=>`<option value="${x}" ${D.distance===x?'selected':''}>${x} km</option>`).join('')}</select></div></div><label style="display:flex;align-items:center;gap:8px;margin-top:9px"><input id="dirOpen" type="checkbox" ${D.openNow?'checked':''}> 🟢 Ouvert maintenant</label><div class="actions" style="margin-top:10px;gap:6px;flex-wrap:wrap">${CATS.map(c=>`<button class="btn ${D.category===c?'brand':''}" onclick="setDirectoryCategory('${e(c)}')">${e(c)}</button>`).join('')}</div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="applyDirectoryFilters()">🔎 Filtrer</button><button class="btn" onclick="useDirectoryLocation()">📍 Utiliser ma position</button><button class="btn" onclick="resetDirectoryFilters()">↺ Réinitialiser</button></div></div>`;
}
window.setDirectoryCategory=function(c){D.category=c;renderDirectoryPage(D.nearby)};
window.applyDirectoryFilters=function(){D.job=document.getElementById('dirJob')?.value||'';D.distance=Number(document.getElementById('dirDistance')?.value||0);D.openNow=!!document.getElementById('dirOpen')?.checked;renderDirectoryPage(D.nearby)};
window.resetDirectoryFilters=function(){D.category='Toutes';D.job='';D.distance=D.nearby?10:0;D.openNow=false;renderDirectoryPage(D.nearby)};
window.useDirectoryLocation=function(){if(!navigator.geolocation)return say('La géolocalisation n’est pas disponible sur cet appareil.');navigator.geolocation.getCurrentPosition(p=>{D.geo={lat:p.coords.latitude,lon:p.coords.longitude};try{localStorage.setItem('ic_resident_geo',JSON.stringify(D.geo))}catch{};if(!D.distance)D.distance=10;renderDirectoryPage(D.nearby)},()=>say('Position refusée ou indisponible.'),{enableHighAccuracy:true,timeout:10000,maximumAge:300000})};
function ensureLeaflet(){
 if(window.L)return Promise.resolve();
 if(!document.querySelector('link[data-ic-leaflet]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset.icLeaflet='1';document.head.appendChild(l)}
 return new Promise((resolve,reject)=>{const old=document.querySelector('script[data-ic-leaflet]');if(old){if(window.L)return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.dataset.icLeaflet='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
}
async function drawMap(rows){
 const host=document.getElementById('icMap');if(!host)return;
 try{await ensureLeaflet();if(!document.getElementById('icMap'))return;if(D.map)try{D.map.remove()}catch{};const g=residentGeo(),center=g?[g.lat,g.lon]:[45.5442,3.2490];D.map=L.map(host).setView(center,g?13:12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(D.map);const bounds=[];if(g){L.circleMarker([g.lat,g.lon],{radius:8}).addTo(D.map).bindPopup('📍 Ma position');bounds.push([g.lat,g.lon])}for(const b of rows.slice(0,250)){const lat=Number(b.latitude),lon=Number(b.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;L.marker([lat,lon]).addTo(D.map).bindPopup(`<b>${e(b.name)}</b><br>${e(categoryOf(b))}`);bounds.push([lat,lon])}if(bounds.length>1)D.map.fitBounds(bounds,{padding:[24,24],maxZoom:15})}catch{if(document.getElementById('icMap'))host.innerHTML='<div class="empty">La carte n’a pas pu se charger. La liste reste disponible.</div>'}
}
window.renderDirectoryPage=async function(nearby=false){
 D.nearby=!!nearby;if(D.nearby&&D.distance===0)D.distance=10;
 main.innerHTML=`<div class="sectionhead"><div><h2>${D.nearby?'📍 Autour de moi':'🏪 Annuaire local d’Issoire'}</h2><p>Chargement des établissements…</p></div></div><div class="empty">Chargement de l’annuaire officiel…</div>`;
 try{await ensureRows()}catch(err){main.innerHTML=`<div class="notice"><b>Impossible de charger l’annuaire.</b><br>${e(err.message||err)}</div>`;return}
 const rows=filtered(),shown=rows.slice(0,120),g=residentGeo();
 main.innerHTML=`<div class="sectionhead"><div><h2>${D.nearby?'📍 Autour de moi':'🏪 Annuaire local d’Issoire'}</h2><p>${rows.length} établissement(s) correspondant aux filtres${g?' · triés par proximité':''}.</p></div>${D.nearby?'<button class="btn" onclick="go(\'businesses\')">Voir tout l’annuaire</button>':'<button class="btn brand" onclick="go(\'nearby\')">🗺 Autour de moi</button>'}</div>${filtersHtml()}${!g&&D.nearby?'<div class="notice"><b>Pour calculer les distances précisément</b><br>Utilisez le bouton « Utiliser ma position ».</div>':''}<div id="icMap" style="height:360px;border-radius:16px;overflow:hidden;margin:12px 0;background:#e9eef5"></div><div class="sectionhead"><div><h2>Résultats</h2><p>${shown.length}${rows.length>shown.length?' premiers':''} affichés</p></div></div><div class="cards">${shown.length?shown.map(directoryCard).join(''):'<div class="empty">Aucun établissement ne correspond à ces filtres.</div>'}</div>`;
 drawMap(rows);
};
go=function(page,...args){const r=_goDirectory(page,...args);if(page==='businesses'||page==='nearby')setTimeout(()=>renderDirectoryPage(page==='nearby'),0);return r};
})();


;/* ===== resident-classifieds-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const R={rows:[]};
const PHOTO_BUCKET='ic-classifieds',MAX_PHOTO_BYTES=5*1024*1024;
const _loadPrivateResident=loadPrivate,_accountResident=accountPage;
function e(v){return esc(String(v??''))}
function isResident(){return !!(S.session&&S.profile?.role!=='admin')}
async function loadResidentAds(){
 if(!isResident()){R.rows=[];return []}
 const {data,error}=await sb.from('ic_classifieds').select('*').eq('user_id',S.session.user.id).order('created_at',{ascending:false});
 if(error){R.rows=[];throw error}
 R.rows=data||[];return R.rows;
}
window.loadResidentAds=loadResidentAds;
loadPrivate=async function(){await _loadPrivateResident();if(!isResident()){R.rows=[];return}try{await loadResidentAds()}catch(err){console.warn('Resident classifieds load failed',err)}};
function status(a){return a.is_active?'<span class="pill">🟢 En ligne</span>':'<span class="pill">⚪ Désactivée</span>'}
function myAdsHtml(){if(!R.rows.length)return '<div class="empty">Vous n’avez encore déposé aucune annonce.</div>';return `<div class="cards">${R.rows.map(a=>`<article class="card" data-resident-ad="${e(a.id)}"><div class="row between"><div>${status(a)}<h3 style="margin-top:7px">${e(a.title)}</h3></div>${a.price!=null?`<strong>${Number(a.price).toFixed(2).replace('.',',')} €</strong>`:''}</div><div class="muted">${e(a.kind||'Annonce')}${a.city?' · '+e(a.city):''}</div>${a.image_url?`<img src="${e(a.image_url)}" alt="Photo de l’annonce" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-top:10px" onerror="this.remove()">`:''}<p>${e(a.description||'')}</p><div class="actions"><button class="btn brand" onclick="openResidentAdForm('${e(a.id)}')">✏️ Modifier</button><button class="btn" onclick="toggleResidentAd('${e(a.id)}',${!!a.is_active})">${a.is_active?'⏸ Désactiver':'▶ Remettre en ligne'}</button><button class="btn" onclick="askDeleteResidentAd('${e(a.id)}')">🗑 Supprimer</button></div></article>`).join('')}</div>`}
accountPage=function(){_accountResident();if(!isResident())return;setTimeout(()=>{if(!main||document.getElementById('residentAdsPanel'))return;main.insertAdjacentHTML('beforeend',`<section id="residentAdsPanel" style="margin-top:20px"><div class="sectionhead"><div><h2>📣 Mes petites annonces</h2><p>Vendez, recherchez, donnez, échangez ou proposez un service localement.</p></div><button class="btn brand" onclick="openResidentAdForm()">➕ Déposer une annonce</button></div><div class="notice"><b>Vous gardez le contrôle.</b><br>Vous pouvez modifier, désactiver, remettre en ligne ou supprimer vos propres annonces. Pour votre sécurité, indiquez seulement votre ville ou votre secteur, jamais votre adresse personnelle précise.</div>${myAdsHtml()}</section>`)},0)};
function storagePathFromUrl(url){
 if(!url)return null;
 try{const u=new URL(url);const marker=`/storage/v1/object/public/${PHOTO_BUCKET}/`;const i=u.pathname.indexOf(marker);return i>=0?decodeURIComponent(u.pathname.slice(i+marker.length)):null}catch{return null}
}
function extensionForFile(file){return ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/heic':'heic','image/heif':'heif'})[file.type]||null}
async function removeStoragePhoto(url){const path=storagePathFromUrl(url);if(!path)return;try{await sb.storage.from(PHOTO_BUCKET).remove([path])}catch(err){console.warn('Photo cleanup failed',err)}}
async function uploadResidentPhoto(file){
 if(!S.session)throw new Error('Connexion requise.');
 if(!file)return null;
 if(file.size>MAX_PHOTO_BYTES)throw new Error('La photo dépasse 5 Mo.');
 const ext=extensionForFile(file);if(!ext)throw new Error('Format photo non pris en charge. Utilisez JPG, PNG, WebP, HEIC ou HEIF.');
 const id=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`);
 const path=`${S.session.user.id}/${id}.${ext}`;
 const {error}=await sb.storage.from(PHOTO_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
 if(error)throw error;
 const {data}=sb.storage.from(PHOTO_BUCKET).getPublicUrl(path);
 if(!data?.publicUrl){await sb.storage.from(PHOTO_BUCKET).remove([path]);throw new Error('Impossible de générer le lien de la photo.');}
 return {path,url:data.publicUrl};
}
window.previewResidentAdPhoto=function(input){const file=input?.files?.[0],img=document.getElementById('raPhotoPreview');if(!img)return;if(!file){img.style.display=img.dataset.current?'block':'none';if(img.dataset.current)img.src=img.dataset.current;return}if(file.size>MAX_PHOTO_BYTES){input.value='';say('La photo dépasse 5 Mo.');return}const ext=extensionForFile(file);if(!ext){input.value='';say('Format photo non pris en charge.');return}const reader=new FileReader();reader.onload=()=>{img.src=reader.result;img.style.display='block'};reader.readAsDataURL(file)};
window.openResidentAdForm=function(id=null){if(!S.session){say('Connectez-vous pour déposer une annonce.');return authModal('account')}const a=id?R.rows.find(x=>x.id===id):null;if(id&&!a)return say('Annonce introuvable.');openModal(`<h2>${a?'✏️ Modifier mon annonce':'➕ Déposer une annonce'}</h2><div class="form"><label>Type d’annonce</label><select id="raKind">${[['vente','Vente'],['recherche','Recherche'],['don','Don'],['echange','Échange'],['service','Service'],['logement','Logement']].map(([v,l])=>`<option value="${v}" ${(a?.kind||'vente')===v?'selected':''}>${l}</option>`).join('')}</select><label>Titre</label><input id="raTitle" maxlength="120" value="${e(a?.title||'')}" placeholder="Ex. Vélo de ville à vendre"><label>Description</label><textarea id="raDescription" rows="5" maxlength="3000" placeholder="Décrivez clairement votre annonce">${e(a?.description||'')}</textarea><div class="two"><div><label>Prix (€) — facultatif</label><input id="raPrice" type="number" min="0" step="0.01" value="${a?.price??''}"></div><div><label>Libellé prix — facultatif</label><input id="raPriceLabel" value="${e(a?.price_label||'')}" placeholder="À débattre, gratuit…"></div></div><label>Ville / secteur</label><input id="raCity" maxlength="100" value="${e(a?.city||S.profile?.city||'Issoire')}" placeholder="Issoire"><label>Photo — facultative, 5 Mo maximum</label><input id="raPhoto" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onchange="previewResidentAdPhoto(this)">${a?.image_url?`<img id="raPhotoPreview" data-current="${e(a.image_url)}" src="${e(a.image_url)}" alt="Photo actuelle" style="display:block;width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin-top:8px"><label style="display:flex;gap:8px;align-items:center"><input id="raRemovePhoto" type="checkbox"> Supprimer la photo actuelle</label>`:`<img id="raPhotoPreview" data-current="" alt="Aperçu" style="display:none;width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin-top:8px">`}<div class="muted">Formats acceptés : JPG, PNG, WebP, HEIC/HEIF.</div><label><input id="raActive" type="checkbox" ${a?.is_active===false?'':'checked'}> Publier l’annonce</label><button id="raSaveBtn" class="btn brand" onclick="saveResidentAd('${id||''}')">💾 ${a?'Enregistrer les modifications':'Publier mon annonce'}</button></div>`)};
window.saveResidentAd=async function(id=''){
 if(!S.session)return say('Connexion requise.');
 const title=document.getElementById('raTitle')?.value.trim(),description=document.getElementById('raDescription')?.value.trim();if(!title||!description)return say('Le titre et la description sont obligatoires.');
 const current=id?R.rows.find(x=>x.id===id):null,oldUrl=current?.image_url||null,file=document.getElementById('raPhoto')?.files?.[0]||null,removePhoto=!!document.getElementById('raRemovePhoto')?.checked;
 const btn=document.getElementById('raSaveBtn');if(btn){btn.disabled=true;btn.textContent=file?'📷 Envoi de la photo…':'💾 Enregistrement…'}
 let uploaded=null,imageUrl=removePhoto?null:oldUrl;
 try{
  if(file){uploaded=await uploadResidentPhoto(file);imageUrl=uploaded.url}
  const p=document.getElementById('raPrice')?.value;
  const payload={kind:document.getElementById('raKind').value,title,description,price:p===''?null:Number(p),price_label:document.getElementById('raPriceLabel').value.trim()||null,city:document.getElementById('raCity').value.trim()||S.profile?.city||'Issoire',image_url:imageUrl,is_active:!!document.getElementById('raActive').checked};
  let q;if(id)q=sb.from('ic_classifieds').update(payload).eq('id',id).eq('user_id',S.session.user.id);else q=sb.from('ic_classifieds').insert({...payload,user_id:S.session.user.id});
  const {error}=await q;if(error)throw error;
  if(oldUrl&&oldUrl!==imageUrl)removeStoragePhoto(oldUrl);
  closeModal();say(id?'Annonce mise à jour.':'Annonce publiée.');try{await loadResidentAds()}catch{};go('account');
 }catch(err){if(uploaded?.path)try{await sb.storage.from(PHOTO_BUCKET).remove([uploaded.path])}catch{};say(err?.message||String(err));if(btn){btn.disabled=false;btn.textContent=id?'💾 Enregistrer les modifications':'💾 Publier mon annonce'}}
};
window.toggleResidentAd=async function(id,current){if(!S.session)return;const {error}=await sb.from('ic_classifieds').update({is_active:!current}).eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);say(!current?'Annonce remise en ligne.':'Annonce désactivée.');try{await loadResidentAds()}catch{};go('account')};
window.askDeleteResidentAd=function(id){const a=R.rows.find(x=>x.id===id);if(!a)return;openModal(`<h2>🗑 Supprimer cette annonce ?</h2><p><b>${e(a.title)}</b></p><p>Cette suppression est définitive et supprimera aussi la photo enregistrée dans Issoire Connect.</p><div class="actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="deleteResidentAd('${e(id)}')">Supprimer</button></div>`)};
window.deleteResidentAd=async function(id){if(!S.session)return;const a=R.rows.find(x=>x.id===id);const {error}=await sb.from('ic_classifieds').delete().eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);if(a?.image_url)removeStoragePhoto(a.image_url);closeModal();say('Annonce supprimée.');try{await loadResidentAds()}catch{};go('account')};
})();


;/* ===== directory-route-fix.js ===== */
(()=>{
if(typeof go!=='function'||typeof renderDirectoryPage!=='function'||typeof main==='undefined')return;
const _wrappedGo=go;
const _enhancedDirectory=renderDirectoryPage;
const _noopDirectory=()=>Promise.resolve();
let desired=null;
let enhancedActive=false;
let settleTimer=null;
let fallbackTimer=null;
let rendering=false;
function clearTimers(){clearTimeout(settleTimer);clearTimeout(fallbackTimer);settleTimer=null;fallbackTimer=null}
function enhancedVisible(page=desired){
 const text=main?.innerText||'';
 return page==='nearby'?/Autour de moi/i.test(text):/Annuaire local d[’']Issoire/i.test(text);
}
async function renderStable(page){
 if(!page||desired!==page||rendering)return;
 clearTimers();
 enhancedActive=true;
 window.renderDirectoryPage=_enhancedDirectory;
 rendering=true;
 try{await _enhancedDirectory(page==='nearby')}finally{rendering=false}
}
function scheduleStable(page,delay=180){
 if(!page||desired!==page||enhancedActive)return;
 clearTimeout(settleTimer);
 settleTimer=setTimeout(()=>renderStable(page),delay);
}
go=function(page,...args){
 const isDirectory=page==='businesses'||page==='nearby';
 if(!isDirectory){
   desired=null;
   enhancedActive=false;
   clearTimers();
   window.renderDirectoryPage=_enhancedDirectory;
   return _wrappedGo(page,...args);
 }
 desired=page;
 enhancedActive=false;
 clearTimers();
 // directory-patch.js contient déjà un setTimeout(...,0) vers renderDirectoryPage.
 // On garde donc la fonction neutre jusqu'à ce que l'ancien écran ait réellement
 // terminé son rendu. Ainsi aucun annuaire V19 éphémère ne peut être réécrasé.
 window.renderDirectoryPage=_noopDirectory;
 let result;
 try{result=_wrappedGo(page,...args)}catch(err){window.renderDirectoryPage=_enhancedDirectory;throw err}
 // Filet de sécurité si l'ancien écran ne produit aucun marqueur de fin.
 fallbackTimer=setTimeout(()=>renderStable(page),3000);
 return result;
};
const observer=new MutationObserver(()=>{
 if(!desired||rendering)return;
 const text=main?.innerText||'';
 if(!enhancedActive){
   // Le répertoire historique affiche cette phrase une fois ses données rendues.
   if(/établissement\(s\) dans votre zone|données locales et répertoire SIRENE/i.test(text)){
     scheduleStable(desired,80);
   }
   return;
 }
 // Si une opération asynchrone historique réécrit malgré tout l'écran après
 // l'activation du nouvel annuaire, on le restaure une seule fois après 120 ms.
 if(!enhancedVisible(desired)){
   const page=desired;
   clearTimeout(settleTimer);
   settleTimer=setTimeout(()=>{if(desired===page&&!enhancedVisible(page))renderStable(page)},120);
 }
});
observer.observe(main,{childList:true,subtree:true,characterData:true});
})();


;/* ===== directory-state-patch.js ===== */
(()=>{
if(typeof window.applyDirectoryFilters!=='function')return;
const state={job:'',distance:'',open:false};
function rememberFromDom(){const q=document.getElementById('dirJob'),d=document.getElementById('dirDistance'),o=document.getElementById('dirOpen');if(q)state.job=q.value;if(d)state.distance=d.value;if(o)state.open=!!o.checked}
function restoreToDom(){const q=document.getElementById('dirJob'),d=document.getElementById('dirDistance'),o=document.getElementById('dirOpen');if(q&&state.job&&q.value!==state.job)q.value=state.job;if(d&&state.distance&&d.value!==state.distance)d.value=state.distance;if(o&&state.open!==!!o.checked)o.checked=state.open}
document.addEventListener('input',ev=>{const t=ev.target;if(!(t instanceof HTMLElement))return;if(t.id==='dirJob')state.job=t.value;if(t.id==='dirDistance')state.distance=t.value;if(t.id==='dirOpen')state.open=!!t.checked},true);
document.addEventListener('change',ev=>{const t=ev.target;if(!(t instanceof HTMLElement))return;if(t.id==='dirJob')state.job=t.value;if(t.id==='dirDistance')state.distance=t.value;if(t.id==='dirOpen')state.open=!!t.checked},true);
const baseApply=window.applyDirectoryFilters;
window.applyDirectoryFilters=function(...args){const q=document.getElementById('dirJob'),d=document.getElementById('dirDistance'),o=document.getElementById('dirOpen');if(q&&state.job&&!q.value)q.value=state.job;if(d&&state.distance)d.value=state.distance;if(o)o.checked=state.open;rememberFromDom();return baseApply.apply(this,args)};
const observer=new MutationObserver(()=>{if(document.getElementById('dirJob'))restoreToDom()});
if(typeof main!=='undefined'&&main)observer.observe(main,{childList:true,subtree:true});
window.icDirectoryPersistentState=state;
})();

;/* ===== public-classifieds-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined'||typeof go!=='function')return;
const P={rows:[],loaded:false,loading:null,q:'',kind:'all',city:'',maxPrice:'',route:'classifieds'};
const KINDS={vente:'Vente',recherche:'Recherche',don:'Don',echange:'Échange',service:'Service',logement:'Logement'};
function e(v){return esc(String(v??''))}
function fold(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function safeImage(v){if(!v)return null;try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}}
function money(v,label){if(label)return e(label);if(v==null||v==='')return '';const n=Number(v);return Number.isFinite(n)?n.toFixed(2).replace('.',',')+' €':''}
async function loadRows(force=false){
 if(P.loaded&&!force)return P.rows;
 if(P.loading&&!force)return P.loading;
 P.loading=(async()=>{
   const {data,error}=await sb.from('ic_classifieds').select('id,user_id,kind,title,description,price,price_label,city,image_url,is_active,created_at').eq('is_active',true).order('created_at',{ascending:false}).limit(500);
   if(error)throw error;
   P.rows=data||[];P.loaded=true;return P.rows;
 })();
 try{return await P.loading}finally{P.loading=null}
}
function filtered(){
 const q=fold(P.q.trim()), city=fold(P.city.trim()), max=P.maxPrice===''?null:Number(P.maxPrice);
 return P.rows.filter(a=>{
   if(P.kind!=='all'&&a.kind!==P.kind)return false;
   if(q&&!fold([a.title,a.description,a.city,KINDS[a.kind]||a.kind].join(' ')).includes(q))return false;
   if(city&&!fold(a.city).includes(city))return false;
   if(max!=null&&Number.isFinite(max)&&a.price!=null&&Number(a.price)>max)return false;
   return true;
 });
}
function card(a){
 const img=safeImage(a.image_url),price=money(a.price,a.price_label),own=S.session?.user?.id===a.user_id;
 return `<article class="card ic-public-ad"><div class="row between"><div><span class="pill">${e(KINDS[a.kind]||a.kind||'Annonce')}</span><h3 style="margin-top:7px">${e(a.title)}</h3></div>${price?`<strong>${price}</strong>`:''}</div>${img?`<img src="${e(img)}" alt="" loading="lazy" style="width:100%;height:210px;object-fit:cover;border-radius:14px;margin:8px 0" onerror="this.remove()">`:''}<p>${e(a.description||'')}</p><div class="muted">📍 ${e(a.city||'Issoire')}</div><div class="actions" style="margin-top:10px">${own?'<button class="btn" onclick="go(\'account\')">✏️ Gérer mon annonce</button>':`<button class="btn brand" onclick="openClassifiedContact('${e(a.id)}')">💬 Contacter</button>`}</div></article>`;
}
function controls(){
 return `<div class="card" style="margin-bottom:12px"><div class="two"><div><label>Recherche</label><input id="caQ" value="${e(P.q)}" placeholder="vélo, meuble, service…"></div><div><label>Type</label><select id="caKind"><option value="all">Toutes</option>${Object.entries(KINDS).map(([v,l])=>`<option value="${v}" ${P.kind===v?'selected':''}>${e(l)}</option>`).join('')}</select></div></div><div class="two" style="margin-top:8px"><div><label>Ville / secteur</label><input id="caCity" value="${e(P.city)}" placeholder="Issoire"></div><div><label>Prix maximum (€)</label><input id="caMax" type="number" min="0" step="1" value="${e(P.maxPrice)}" placeholder="Sans limite"></div></div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="applyClassifiedFilters()">🔎 Filtrer</button><button class="btn" onclick="resetClassifiedFilters()">↺ Réinitialiser</button><button class="btn" onclick="openResidentClassifiedEntry()">➕ Déposer une annonce</button></div></div>`;
}
window.applyClassifiedFilters=function(){P.q=document.getElementById('caQ')?.value||'';P.kind=document.getElementById('caKind')?.value||'all';P.city=document.getElementById('caCity')?.value||'';P.maxPrice=document.getElementById('caMax')?.value||'';renderPublicClassifieds()};
window.resetClassifiedFilters=function(){P.q='';P.kind='all';P.city='';P.maxPrice='';renderPublicClassifieds()};
window.openResidentClassifiedEntry=function(){if(!S.session)return authModal('account');go('account');setTimeout(()=>{if(typeof openResidentAdForm==='function')openResidentAdForm()},250)};
window.openClassifiedContact=function(id){const a=P.rows.find(x=>x.id===id);if(!a)return say('Annonce introuvable.');if(!S.session)return authModal('account');if(S.session.user.id===a.user_id)return go('account');openModal(`<h2>💬 Contacter l’annonceur</h2><p><b>${e(a.title)}</b></p><div class="notice">Votre message est envoyé dans Issoire Connect. Votre adresse personnelle n’est pas affichée.</div><label>Message</label><textarea id="classifiedMessage" rows="5" maxlength="2000" placeholder="Bonjour, votre annonce est-elle toujours disponible ?"></textarea><button class="btn brand" onclick="sendClassifiedContact('${e(id)}')">Envoyer le message</button>`)};
window.sendClassifiedContact=async function(id){if(!S.session)return authModal('account');const body=document.getElementById('classifiedMessage')?.value.trim();if(!body)return say('Écrivez un message avant l’envoi.');const {error}=await sb.rpc('ic_send_message',{p_body:body,p_business_id:null,p_classified_id:id});if(error)return say(error.message);closeModal();say('Message envoyé à l’annonceur.')};
window.renderPublicClassifieds=async function(){
 main.innerHTML='<div class="sectionhead"><div><h2>📣 Petites annonces locales</h2><p>Chargement des annonces…</p></div></div><div class="empty">Chargement…</div>';
 try{await loadRows()}catch(err){main.innerHTML=`<div class="notice"><b>Impossible de charger les annonces.</b><br>${e(err.message||err)}</div>`;return}
 const rows=filtered();
 main.innerHTML=`<div class="sectionhead"><div><h2>📣 Petites annonces locales</h2><p>${rows.length} annonce(s) active(s). Vente, recherche, don, échange, service et logement.</p></div><button class="btn brand" onclick="openResidentClassifiedEntry()">➕ Déposer</button></div><div class="notice"><b>Sécurité :</b> échangez d’abord via la messagerie. N’affichez pas votre adresse personnelle précise dans une annonce.</div>${controls()}${rows.length?`<div class="cards">${rows.slice(0,120).map(card).join('')}</div>${rows.length>120?'<div class="notice">Affichage limité aux 120 premières annonces. Utilisez les filtres pour affiner.</div>':''}`:'<div class="empty">Aucune annonce ne correspond aux filtres.</div>'}`;
};
const oldGo=go;
go=function(page,...args){const result=oldGo(page,...args);if(page==='classifieds')setTimeout(()=>renderPublicClassifieds(),220);return result};
})();


;/* ===== moderation-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const M={reports:[],current:null};
const REASONS={spam:'Spam / publicité abusive',fraud:'Fraude / arnaque suspectée',inappropriate:'Contenu inapproprié',outdated:'Information obsolète ou erronée',other:'Autre'};
const TARGETS={business:{table:'ic_businesses',label:'Entreprise'},classified:{table:'ic_classifieds',label:'Annonce'}};
const DISABLE_TABLE={business:'ic_businesses',offer:'ic_offers',product:'ic_products',job:'ic_jobs',classified:'ic_classifieds',event:'ic_events'};
function e(v){return typeof esc==='function'?esc(String(v??'')):String(v??'')}
function admin(){return !!(S.session&&S.profile?.role==='admin')}
function statusBadge(s){return `<span class="pill">${s==='pending'?'🟠 En attente':s==='reviewed'?'🔵 Examiné':s==='actioned'?'🔴 Action effectuée':'⚪ Ignoré'}</span>`}
async function targetSnapshot(type,id,label){
 try{
  if(type==='business'){
   const {data}=await sb.from('ic_businesses').select('id,name,category,address,city,postal_code,siret,is_active').eq('id',id).maybeSingle();
   return data||{label};
  }
  if(type==='classified'){
   const {data}=await sb.from('ic_classifieds').select('id,kind,title,description,price,price_label,city,is_active').eq('id',id).maybeSingle();
   return data||{label};
  }
 }catch{}
 return {label};
}
window.openReportContent=async function(type,id,label='Contenu'){
 if(!S.session)return authModal('account');
 if(!TARGETS[type])return say('Ce type de contenu ne peut pas être signalé ici.');
 const {data:existing,error}=await sb.from('ic_reports').select('id').eq('reporter_id',S.session.user.id).eq('target_type',type).eq('target_id',id).eq('status','pending').limit(1);
 if(error)return say(error.message);
 if(existing?.length)return say('Vous avez déjà un signalement en attente pour ce contenu.');
 M.current={type,id,label:String(label||'Contenu')};
 openModal(`<h2>🚩 Signaler ce contenu</h2><p><b>${e(M.current.label)}</b></p><div class="notice">Le signalement est envoyé uniquement à l’administration d’Issoire Connect. Il ne supprime pas automatiquement le contenu.</div><label>Motif</label><select id="reportReason">${Object.entries(REASONS).map(([v,l])=>`<option value="${v}">${e(l)}</option>`).join('')}</select><label>Détails — facultatif</label><textarea id="reportDetails" rows="5" maxlength="2000" placeholder="Expliquez brièvement le problème constaté."></textarea><button id="reportSendBtn" class="btn brand" onclick="submitContentReport()">🚩 Envoyer le signalement</button>`);
};
window.submitContentReport=async function(){
 if(!S.session)return authModal('account');
 const current=M.current;if(!current)return say('Signalement expiré. Rouvrez le formulaire.');
 const reason=document.getElementById('reportReason')?.value||'other',details=document.getElementById('reportDetails')?.value.trim()||null;
 const btn=document.getElementById('reportSendBtn');if(btn){btn.disabled=true;btn.textContent='Envoi…'}
 const snapshot=await targetSnapshot(current.type,current.id,current.label);
 const {error}=await sb.from('ic_reports').insert({reporter_id:S.session.user.id,target_type:current.type,target_id:current.id,target_label:current.label,target_snapshot:snapshot,reason,details,status:'pending'});
 if(error){if(btn){btn.disabled=false;btn.textContent='🚩 Envoyer le signalement'}return say(error.message)}
 M.current=null;closeModal();say('Signalement envoyé à l’administration. Merci.');
};
function decorateClassifiedReports(){
 document.querySelectorAll('article.ic-public-ad').forEach(card=>{
  if(card.querySelector('[data-report-classified]'))return;
  const contact=[...card.querySelectorAll('button')].find(b=>/openClassifiedContact/.test(b.getAttribute('onclick')||''));
  if(!contact)return;
  const m=(contact.getAttribute('onclick')||'').match(/openClassifiedContact\('([^']+)'\)/);if(!m)return;
  const id=m[1],label=card.querySelector('h3')?.textContent?.trim()||'Petite annonce';
  const b=document.createElement('button');b.className='btn';b.dataset.reportClassified='1';b.textContent='🚩 Signaler';b.onclick=()=>openReportContent('classified',id,label);
  contact.parentElement?.appendChild(b);
 });
}
if(typeof renderPublicClassifieds==='function'){
 const _renderPublicClassifieds=renderPublicClassifieds;
 window.renderPublicClassifieds=async function(...args){const r=await _renderPublicClassifieds(...args);decorateClassifiedReports();return r};
}
if(typeof viewBusiness==='function'){
 const _viewBusinessModeration=viewBusiness;
 window.viewBusiness=function(id){
  const r=_viewBusinessModeration(id);
  const b=(S.businesses||[]).find(x=>x.id===id)||(S.myBusinesses||[]).find(x=>x.id===id);
  setTimeout(()=>{
   if(!b||typeof modalBody==='undefined'||!modalBody||modalBody.querySelector('[data-report-business]'))return;
   const wrap=document.createElement('div');wrap.className='actions';wrap.style.marginTop='10px';
   const btn=document.createElement('button');btn.className='btn';btn.dataset.reportBusiness='1';btn.textContent='🚩 Signaler une erreur / un problème';btn.onclick=()=>openReportContent('business',id,b.name||'Entreprise');
   wrap.appendChild(btn);modalBody.appendChild(wrap);
  },0);
  return r;
 };
}
async function loadReports(){
 if(!admin())return [];
 const {data,error}=await sb.from('ic_reports').select('*').order('created_at',{ascending:false}).limit(150);
 if(error)throw error;M.reports=data||[];return M.reports;
}
function moderationCard(r){
 const canDisable=!!DISABLE_TABLE[r.target_type]&&r.status!=='actioned';
 return `<article class="card"><div class="row between"><div>${statusBadge(r.status)}<h3 style="margin-top:7px">${e(r.target_label)}</h3></div><span class="pill">${e(r.target_type)}</span></div><div class="muted">${new Date(r.created_at).toLocaleString('fr-FR')} · ${e(REASONS[r.reason]||r.reason)}</div>${r.details?`<p>${e(r.details)}</p>`:'<p class="muted">Aucun détail supplémentaire.</p>'}${r.admin_note?`<div class="notice"><b>Note admin :</b> ${e(r.admin_note)}</div>`:''}<div class="actions"><button class="btn brand" onclick="openReportReview('${e(r.id)}')">👁 Examiner</button>${canDisable?`<button class="btn" onclick="confirmDisableReportedContent('${e(r.id)}')">⛔ Désactiver le contenu</button>`:''}</div></article>`;
}
window.openReportsAdmin=async function(){
 if(!admin())return say('Accès administrateur requis.');
 main.innerHTML='<div class="sectionhead"><div><span class="pill">👑 ADMIN</span><h2 style="margin-top:8px">🚨 Signalements & modération</h2><p>Chargement…</p></div><button class="btn" onclick="adminAccount()">← Administration</button></div><div class="empty">Chargement des signalements…</div>';
 try{await loadReports()}catch(err){main.innerHTML=`<div class="notice">Erreur : ${e(err.message||err)}</div>`;return}
 const pending=M.reports.filter(r=>r.status==='pending').length;
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">👑 ADMIN</span><h2 style="margin-top:8px">🚨 Signalements & modération</h2><p>${pending} en attente · ${M.reports.length} signalement(s) affiché(s)</p></div><button class="btn" onclick="adminAccount()">← Administration</button></div>${M.reports.length?`<div class="cards">${M.reports.map(moderationCard).join('')}</div>`:'<div class="empty">Aucun signalement pour le moment.</div>'}`;
};
window.openReportReview=function(id){
 if(!admin())return;const r=M.reports.find(x=>x.id===id);if(!r)return say('Signalement introuvable.');
 openModal(`<h2>👁 Examiner le signalement</h2><p><b>${e(r.target_label)}</b></p><div class="notice">${e(REASONS[r.reason]||r.reason)}${r.details?'<br>'+e(r.details):''}</div><label>Décision</label><select id="reviewStatus"><option value="reviewed" ${r.status==='reviewed'?'selected':''}>Examiné</option><option value="dismissed" ${r.status==='dismissed'?'selected':''}>Ignoré / non fondé</option><option value="actioned" ${r.status==='actioned'?'selected':''}>Action effectuée</option><option value="pending" ${r.status==='pending'?'selected':''}>Remettre en attente</option></select><label>Note administrateur — facultative</label><textarea id="reviewNote" rows="4" maxlength="2000">${e(r.admin_note||'')}</textarea><button class="btn brand" onclick="saveReportReview('${e(id)}')">💾 Enregistrer</button>`);
};
window.saveReportReview=async function(id){
 if(!admin())return;const status=document.getElementById('reviewStatus')?.value||'reviewed',admin_note=document.getElementById('reviewNote')?.value.trim()||null;
 const payload={status,admin_note,reviewed_by:S.session.user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
 if(status==='pending'){payload.reviewed_by=null;payload.reviewed_at=null}
 const {error}=await sb.from('ic_reports').update(payload).eq('id',id);if(error)return say(error.message);closeModal();say('Signalement mis à jour.');openReportsAdmin();
};
window.confirmDisableReportedContent=function(id){
 if(!admin())return;const r=M.reports.find(x=>x.id===id);if(!r)return;openModal(`<h2>⛔ Désactiver ce contenu ?</h2><p><b>${e(r.target_label)}</b></p><div class="notice">Le contenu sera rendu invisible mais pas supprimé. Vous pourrez le réactiver depuis l’administration.</div><div class="actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="disableReportedContent('${e(id)}')">Désactiver</button></div>`);
};
window.disableReportedContent=async function(id){
 if(!admin())return;const r=M.reports.find(x=>x.id===id),table=r&&DISABLE_TABLE[r.target_type];if(!r||!table)return say('Ce contenu ne peut pas être désactivé automatiquement.');
 const {error}=await sb.from(table).update({is_active:false}).eq('id',r.target_id);if(error)return say(error.message);
 const {error:reportError}=await sb.from('ic_reports').update({status:'actioned',admin_note:r.admin_note||'Contenu désactivé depuis la file de modération.',reviewed_by:S.session.user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);
 if(reportError)return say(reportError.message);closeModal();say('Contenu désactivé et signalement traité.');try{if(typeof refresh==='function')await refresh()}catch{};openReportsAdmin();
};
if(typeof adminAccount==='function'){
 const _adminAccountModeration=adminAccount;
 window.adminAccount=function(...args){
  const r=_adminAccountModeration(...args);
  if(admin())setTimeout(()=>{if(document.getElementById('adminModerationShortcut'))return;const head=main.querySelector('.sectionhead');if(head)head.insertAdjacentHTML('afterend','<div id="adminModerationShortcut" class="actions" style="margin:10px 0"><button class="btn brand" onclick="openReportsAdmin()">🚨 Signalements & modération</button></div>')},0);
  return r;
 };
}
})();


;/* ===== plans-patch.js ===== */
(()=>{
if(typeof S==='undefined')return;
const PLANS={
 essential:{label:'Essential',price:'4,99 € / mois',radius:5,features:['Fiche professionnelle complète','Jusqu’à 20 produits/services actifs','2 offres ou invendus par mois','Messagerie clients','Rayon de visibilité jusqu’à 5 km','Jusqu’à 3 annonces professionnelles actives'],blocked:['Commandes/devis/réservations en ligne','Emplois et événements professionnels','Campagnes sponsorisées','Notifications automatiques aux abonnés']},
 pro:{label:'Pro',price:'9,99 € / mois',radius:20,features:['Produits/services sans limite de forfait','Offres/promos/invendus sans limite mensuelle','Commandes, devis et réservations en ligne','Publication d’emplois et événements','Campagnes sponsorisées standard','Notifications aux abonnés : jusqu’à 6 alertes / 24 h','Rayon de visibilité jusqu’à 20 km','Jusqu’à 10 annonces professionnelles actives'],blocked:[]},
 proplus:{label:'Pro+',price:'19,99 € / mois',radius:50,features:['Toutes les fonctions Pro','Rayon de visibilité jusqu’à 50 km','Jusqu’à 30 annonces professionnelles actives','Notifications aux abonnés : jusqu’à 12 alertes / 24 h','Campagnes sponsorisées incluses'],blocked:[]}
};
const LINKS={essential:'https://buy.stripe.com/test_00w14ob7wajWgGb5K518c03',pro:'https://buy.stripe.com/test_dRm8wQ2B0cs4cpVb4p18c04',proplus:'https://buy.stripe.com/test_00w7sMb7w3VygGb2xT18c05'};
const RADIUS_CHOICES=[2,5,10,20,30,50];
function e(v){return typeof esc==='function'?esc(String(v??'')):String(v??'')}
function businessById(id){return (S.myBusinesses||[]).find(x=>x.id===id)||(S.businesses||[]).find(x=>x.id===id)||null}
function planOfBusiness(b){const p=b?.plan||'free';return ['essential','pro','proplus'].includes(p)?p:'free'}
function currentPlan(){if(S.profile?.role==='admin')return 'admin';const p=S.subscription?.plan||S.subscriptions?.plan||S.mySubscription?.plan||S.myBusinesses?.[0]?.plan||'free';return ['essential','pro','proplus'].includes(p)?p:'free'}
function canTransactions(p){return p==='pro'||p==='proplus'}
function canJobsEvents(p){return p==='pro'||p==='proplus'}
function canAds(p){return p==='pro'||p==='proplus'}
function maxRadiusFor(p){return p==='proplus'?50:p==='pro'?20:p==='essential'?5:2}
function neededPlanForRadius(km){return km<=5?'Essential':km<=20?'Pro':'Pro+'}
function monthCountOffers(bid){const now=new Date();return (S.offers||[]).filter(o=>o.business_id===bid&&(!o.created_at||(new Date(o.created_at).getFullYear()===now.getFullYear()&&new Date(o.created_at).getMonth()===now.getMonth()))).length}
function activeProductCount(bid){return (S.products||[]).filter(p=>p.business_id===bid&&p.is_active!==false).length}
function upgrade(feature,need='Pro'){const label=need==='Essential'?'Essential — 4,99 €':need==='Pro+'?'Pro+ — 19,99 €':'Pro — 9,99 €';const html=`<h2>🔒 ${e(feature)}</h2><p>Cette fonction n’est pas incluse dans votre forfait actuel.</p><div class="notice">Passez au forfait <b>${label}</b> pour l’activer.</div><div class="actions"><button class="btn brand" onclick="closeModal();openIcPlans()">Voir les forfaits</button><button class="btn" onclick="closeModal()">Fermer</button></div>`;if(typeof openModal==='function')openModal(html);else if(typeof say==='function')say(`${feature} nécessite ${label}.`)}
function offlineContact(b,kind){const label=kind==='reserve'?'Réservation en ligne':'Commande / devis en ligne';const actions=[];if(b?.owner_id)actions.push(`<button class="btn brand" onclick="closeModal();messageBusiness('${e(b.id)}')">💬 Envoyer un message</button>`);if(b?.phone)actions.push(`<a class="btn" href="tel:${e(b.phone)}">📞 Appeler</a>`);actions.push('<button class="btn" onclick="closeModal()">Fermer</button>');openModal(`<h2>${label}</h2><p>Ce commerce utilise actuellement le forfait <b>${e(PLANS[planOfBusiness(b)]?.label||'gratuit')}</b>. La transaction en ligne n’est donc pas activée.</p><div class="notice">Vous pouvez quand même contacter directement le commerce.</div><div class="actions">${actions.join('')}</div>`)}
function planCard(k,p,current){const isCurrent=current===k;return `<article class="card" style="border:${isCurrent?'2px solid #188650':'1px solid var(--line,#dce3ee)'}"><div class="row between"><div><span class="pill">${isCurrent?'✓ FORFAIT ACTUEL':'PRO'}</span><h3 style="margin:8px 0 2px">${e(p.label)}</h3><strong style="font-size:22px">${e(p.price)}</strong></div><span class="pill">📍 ${p.radius} km</span></div><ul style="line-height:1.65;padding-left:20px">${p.features.map(x=>`<li>✅ ${e(x)}</li>`).join('')}${p.blocked.map(x=>`<li class="muted">— ${e(x)}</li>`).join('')}</ul>${isCurrent?'<div class="notice"><b>Ce forfait est actif sur votre compte.</b></div>':`<button class="btn brand" onclick="startIcPlanCheckout('${k}')">Choisir ${e(p.label)}</button>`}</article>`}
function radiusPanel(b){const p=planOfBusiness(b),max=maxRadiusFor(p),current=Number(b.visibility_radius_km||Math.min(2,max));return `<section id="icRadiusPanel" class="card" style="margin-bottom:14px"><div class="row between"><div><span class="pill">📍 ZONE DE VISIBILITÉ</span><h3 style="margin:7px 0 3px">Rayon actuel : ${current} km</h3><div class="muted">Votre forfait ${e(PLANS[p]?.label||'gratuit')} autorise jusqu’à ${max} km.</div></div></div><div class="actions" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px">${RADIUS_CHOICES.map(km=>{const locked=km>max,active=km===current;return `<button type="button" class="btn ${active?'brand':''} ${locked?'locked':''}" data-ic-radius="${km}" aria-pressed="${active?'true':'false'}" title="${locked?`Nécessite ${neededPlanForRadius(km)}`:`Choisir un rayon de ${km} km`}" onclick="${locked?`offerIcRadiusUpgrade(${km})`:`setIcBusinessRadius('${e(b.id)}',${km})`}">${locked?'🔒 ':active?'✓ ':''}${km} km</button>`}).join('')}</div></section>`}
window.openIcPlans=function(){const current=currentPlan();const html=`<h2>💳 Forfaits professionnels</h2><div class="notice"><b>MODE TEST STRIPE</b><br>Aucun paiement réel n’est encaissé pour le moment. Les droits ci-dessous correspondent aux règles actuellement testées et appliquées par la base.</div><div class="cards" style="margin-top:12px">${Object.entries(PLANS).map(([k,p])=>planCard(k,p,current)).join('')}</div><p class="muted" style="margin-top:12px">Le changement de forfait est appliqué automatiquement après confirmation Stripe via le webhook sécurisé.</p>`;if(typeof openModal==='function')openModal(html);else if(typeof main!=='undefined')main.innerHTML=html};
window.startIcPlanCheckout=function(plan){if(!PLANS[plan]||!LINKS[plan])return;if(!S.session){if(typeof authModal==='function')return authModal('account');return typeof say==='function'?say('Connectez-vous avec un compte professionnel.'):null}if(S.profile?.role==='admin')return typeof say==='function'?say('Le compte administrateur dispose déjà de tous les droits de test.'):null;if(S.profile?.role!=='pro')return typeof say==='function'?say('Utilisez un compte professionnel pour souscrire un forfait.'):null;const u=new URL(LINKS[plan]);u.searchParams.set('client_reference_id',S.session.user.id);window.open(u.toString(),'_blank','noopener,noreferrer')};
window.offerIcRadiusUpgrade=function(km){upgrade(`Rayon de visibilité ${km} km`,neededPlanForRadius(Number(km)||0))};
window.setIcBusinessRadius=async function(id,km){const b=businessById(id);if(!b||!S.session||b.owner_id!==S.session.user.id)return typeof say==='function'?say('Accès refusé.'):null;km=Number(km);const max=maxRadiusFor(planOfBusiness(b));if(!RADIUS_CHOICES.includes(km)||km>max)return offerIcRadiusUpgrade(km);if(typeof sb==='undefined')return typeof say==='function'?say('Connexion indisponible.'):null;const {error}=await sb.from('ic_businesses').update({visibility_radius_km:km,updated_at:new Date().toISOString()}).eq('id',id).eq('owner_id',S.session.user.id);if(error)return typeof say==='function'?say(error.message):null;b.visibility_radius_km=km;const mb=(S.myBusinesses||[]).find(x=>x.id===id);if(mb)mb.visibility_radius_km=km;const pb=(S.businesses||[]).find(x=>x.id===id);if(pb)pb.visibility_radius_km=km;if(typeof say==='function')say(`Rayon de visibilité réglé sur ${km} km.`);if(typeof proAccount==='function')proAccount()};
window.icPlanEntitlements=PLANS;

if(typeof pricingHtml==='function'){
 window.pricingHtml=function(logged,current){const rows=[['essential','Essential','4,99 €','5 km · 20 produits/services · 2 offres ou invendus/mois · messagerie'],['pro','Pro','9,99 €','20 km · catalogue/offres sans limite de forfait · commandes/devis/réservations · emplois/événements · pub sponsorisée standard'],['proplus','Pro+','19,99 €','50 km · tout Pro · davantage d’annonces et notifications · campagnes sponsorisées incluses']];return `<div class="cards">${rows.map(p=>`<div class="plan ${p[0]==='pro'?'pop':''}"><h3>${p[1]}</h3><div class="amount">${p[2]} <small>/mois</small></div><p class="muted">${p[3]}</p>${current===p[0]?'<span class="pill">Formule actuelle</span>':logged?`<button class="btn brand" onclick="startIcPlanCheckout('${p[0]}')">Tester l’abonnement</button>`:'<button class="btn brand" onclick="authModal(\'account\')">Créer un compte pro</button>'}</div>`).join('')}</div>`}
}

const baseNewProduct=typeof newProduct==='function'?newProduct:null;
const baseNewOffer=typeof newOffer==='function'?newOffer:null;
const baseNewJob=typeof newJob==='function'?newJob:null;
const baseNewEvent=typeof newBusinessEvent==='function'?newBusinessEvent:null;
const baseReserve=typeof reserveOffer==='function'?reserveOffer:null;
const baseOrder=typeof orderProduct==='function'?orderProduct:null;

if(baseNewProduct)window.newProduct=function(bid){const p=planOfBusiness(businessById(bid));if(p==='free')return upgrade('Publication de produits/services','Essential');if(p==='essential'&&activeProductCount(bid)>=20)return upgrade('Limite de 20 produits/services atteinte','Pro');return baseNewProduct(bid)};
if(baseNewOffer)window.newOffer=function(bid,type){const p=planOfBusiness(businessById(bid));if(p==='free')return upgrade('Publication d’offres','Essential');if(p==='essential'&&monthCountOffers(bid)>=2)return upgrade('Limite de 2 offres ou invendus ce mois-ci atteinte','Pro');return baseNewOffer(bid,type)};
if(baseNewJob)window.newJob=function(bid){const p=planOfBusiness(businessById(bid));if(!canJobsEvents(p))return upgrade('Publication d’offres d’emploi','Pro');return baseNewJob(bid)};
if(baseNewEvent)window.newBusinessEvent=function(bid){const p=planOfBusiness(businessById(bid));if(!canJobsEvents(p))return upgrade('Publication d’événements professionnels','Pro');return baseNewEvent(bid)};
window.newAd=function(bid){const b=businessById(bid),p=planOfBusiness(b);if(!canAds(p))return upgrade('Campagnes sponsorisées','Pro');const note=p==='proplus'?'Pro+ : campagne sponsorisée incluse.':'Pro : campagne sponsorisée standard.';openModal(`<h2>Campagne sponsorisée</h2><div class="notice">${note}</div><div class="form" style="margin-top:10px"><input id="at" placeholder="Titre de la promotion"><input id="au" placeholder="Lien cible (facultatif)"><select id="ad"><option value="10">10 secondes</option><option value="15" selected>15 secondes</option><option value="20">20 secondes</option><option value="30">30 secondes</option></select><button class="btn primary" onclick="saveAd('${e(bid)}')">Lancer la campagne</button></div>`)};
if(baseReserve)window.reserveOffer=function(id){const o=(S.offers||[]).find(x=>x.id===id),b=businessById(o?.business_id);if(b&&!canTransactions(planOfBusiness(b)))return offlineContact(b,'reserve');return baseReserve(id)};
if(baseOrder)window.orderProduct=function(id){const p=(S.products||[]).find(x=>x.id===id),b=businessById(p?.business_id);if(b&&!canTransactions(planOfBusiness(b)))return offlineContact(b,'order');return baseOrder(id)};

if(typeof proAccount==='function'){
 const baseProAccount=proAccount;
 window.proAccount=function(...args){const r=baseProAccount(...args);setTimeout(()=>{
  if(typeof main==='undefined')return;const cur=currentPlan(),p=PLANS[cur];
  if(!document.getElementById('icPlanPanel')){const box=document.createElement('section');box.id='icPlanPanel';box.className='card';box.style.marginBottom='14px';box.innerHTML=cur==='admin'?'<div class="row between"><div><span class="pill">👑 ADMIN</span><h3 style="margin:7px 0">Tous les droits de test</h3><div class="muted">Le compte administrateur n’est pas soumis aux limites commerciales.</div></div><button class="btn brand" onclick="openIcPlans()">Voir les forfaits</button></div>':p?`<div class="row between"><div><span class="pill">FORFAIT ACTUEL</span><h3 style="margin:7px 0">${e(p.label)} · ${e(p.price)}</h3><div class="muted">Rayon maximum ${p.radius} km · droits contrôlés côté serveur.</div></div><button class="btn brand" onclick="openIcPlans()">Comparer / changer</button></div>`:'<div class="row between"><div><span class="pill">FORFAIT GRATUIT</span><h3 style="margin:7px 0">Passez à un forfait professionnel</h3><div class="muted">Activez les publications et fonctions professionnelles.</div></div><button class="btn brand" onclick="openIcPlans()">Voir les forfaits</button></div>';main.prepend(box)}
  const b=S.myBusinesses?.[0];if(!b)return;const bp=planOfBusiness(b);const usage=document.createElement('section');usage.id='icPlanUsage';usage.className='notice';const prod=activeProductCount(b.id),off=monthCountOffers(b.id);usage.innerHTML=bp==='essential'?`<b>Utilisation Essential :</b> ${prod}/20 produits/services · ${off}/2 offres ou invendus ce mois-ci. Les boutons Emploi, Événement et Pub locale ouvrent une proposition de passage à Pro.`:bp==='pro'?'<b>Droits Pro actifs :</b> commandes/devis/réservations, emplois, événements et campagnes sponsorisées standard.':'<b>Droits Pro+ actifs :</b> toutes les fonctions Pro avec rayon jusqu’à 50 km.';const grid=[...main.querySelectorAll('.gridmenu')].find(g=>/Produit\/service/i.test(g.innerText||''));if(grid&&!document.getElementById('icPlanUsage'))grid.before(usage);
  if(grid&&!document.getElementById('icRadiusPanel'))grid.insertAdjacentHTML('beforebegin',radiusPanel(b));
  if(grid){[...grid.querySelectorAll('button.tile')].forEach(btn=>{const t=btn.innerText||'';let locked=false;if(bp==='free')locked=true;else if(bp==='essential'&&/(Emploi|Événement|Pub locale)/i.test(t))locked=true;if(locked&&!/🔒/.test(t)){btn.querySelector('span')?.insertAdjacentText('afterbegin','🔒 ');btn.title='Cette fonction nécessite un forfait supérieur';btn.style.opacity='.72'}})}
 },0);return r}
}
})();


;/* ===== admin-plan-access-patch.js ===== */
(()=>{
if(typeof S==='undefined')return;

function isIcAdmin(){return S.profile?.role==='admin'}
function elevateAdminPlans(){
  for(const key of ['myBusinesses','businesses']){
    for(const b of (S[key]||[])){
      if(!b)continue;
      if(isIcAdmin()){
        if(b.plan!=='proplus'){
          try{Object.defineProperty(b,'__icAdminOriginalPlan',{value:b.plan||'free',writable:true,configurable:true,enumerable:false})}catch(_){b.__icAdminOriginalPlan=b.plan||'free'}
          b.plan='proplus';
        }
      }else if(Object.prototype.hasOwnProperty.call(b,'__icAdminOriginalPlan')){
        b.plan=b.__icAdminOriginalPlan||'free';
        try{delete b.__icAdminOriginalPlan}catch(_){}
      }
    }
  }
}

const wrapNames=['newProduct','newOffer','newJob','newBusinessEvent','newAd','reserveOffer','orderProduct','openIcPlans'];
for(const name of wrapNames){
  const base=window[name];
  if(typeof base==='function')window[name]=function(...args){elevateAdminPlans();return base.apply(this,args)};
}

if(typeof window.proAccount==='function'){
  const baseProAccount=window.proAccount;
  window.proAccount=function(...args){
    elevateAdminPlans();
    const r=baseProAccount.apply(this,args);
    setTimeout(elevateAdminPlans,0);
    return r;
  };
}

if(typeof window.setIcBusinessRadius==='function'){
  const baseSetRadius=window.setIcBusinessRadius;
  window.setIcBusinessRadius=async function(id,km){
    elevateAdminPlans();
    if(!isIcAdmin())return baseSetRadius(id,km);
    km=Number(km);
    if(![2,5,10,20,30,50].includes(km))return typeof say==='function'?say('Rayon invalide.'):null;
    if(typeof sb==='undefined')return typeof say==='function'?say('Connexion indisponible.'):null;
    const {data,error}=await sb.rpc('ic_set_business_visibility_radius',{p_business_id:id,p_radius:km});
    if(error)return typeof say==='function'?say(error.message):null;
    for(const key of ['myBusinesses','businesses']){
      const b=(S[key]||[]).find(x=>x.id===id);
      if(b){b.visibility_radius_km=Number(data||km);b.plan='proplus'}
    }
    if(typeof say==='function')say(`Rayon administrateur réglé sur ${Number(data||km)} km.`);
    if(typeof proAccount==='function')proAccount();
    return data;
  };
}

window.icAdminHasAllPlans=()=>isIcAdmin();
elevateAdminPlans();
setInterval(elevateAdminPlans,1000);
})();


;/* ===== ads-system-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
const state={campaigns:[],current:null};
const isAdmin=()=>S.profile?.role==='admin';
function biz(id){return (S.myBusinesses||[]).find(x=>x.id===id)||(S.businesses||[]).find(x=>x.id===id)||null}
function plan(b){if(isAdmin())return 'proplus';const p=b?.plan||'free';return ['essential','pro','proplus'].includes(p)?p:'free'}
function maxRadius(p){return p==='proplus'?50:p==='pro'?20:p==='essential'?5:2}
function canAds(p){return p==='pro'||p==='proplus'}
function geo(){for(const x of [S.residentGeo,S.geo,S.location]){if(x){const lat=Number(x.lat??x.latitude),lon=Number(x.lon??x.lng??x.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon))return {lat,lon}}}try{const x=JSON.parse(localStorage.getItem('ic_resident_geo')||'null');if(x){const lat=Number(x.lat??x.latitude),lon=Number(x.lon??x.lng??x.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon))return {lat,lon}}}catch{}return null}
function km(a,b,c,d){const R=6371,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,q=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function sessionKey(){let k=localStorage.getItem('ic_ad_session');if(!k){k=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2));localStorage.setItem('ic_ad_session',k)}return k}
async function track(id,type){try{await sb.rpc('ic_track_ad_event',{p_campaign_id:id,p_event_type:type,p_session_key:sessionKey()})}catch{}}
function safeUrl(v){if(!v)return null;try{const u=new URL(/^https?:\/\//i.test(v)?v:'https://'+v);return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}}
async function fetchBusinessMap(ids){const out=new Map();for(const b of (S.businesses||[]))if(ids.includes(b.id))out.set(b.id,b);const miss=ids.filter(id=>!out.has(id));if(miss.length){const {data}=await sb.from('ic_businesses').select('id,name,latitude,longitude,is_active').in('id',miss);for(const b of data||[])out.set(b.id,b)}return out}
async function chooseAd(){const audience=S.profile?.role==='pro'||S.profile?.role==='admin'?['professionals','all']:['residents','all'];const {data,error}=await sb.from('ic_ad_campaigns').select('id,business_id,title,image_url,target_url,duration_seconds,frequency_minutes,target_radius_km,target_audience,placement,starts_at,ends_at,is_active').eq('is_active',true).in('target_audience',audience).lte('starts_at',new Date().toISOString()).limit(40);if(error)return null;let rows=(data||[]).filter(a=>!a.ends_at||new Date(a.ends_at)>new Date());if(!rows.length)return null;const map=await fetchBusinessMap([...new Set(rows.map(a=>a.business_id))]);const g=geo();rows=rows.filter(a=>{const b=map.get(a.business_id);if(!b||b.is_active===false)return false;if(!g)return true;const lat=Number(b.latitude),lon=Number(b.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon))return true;return km(g.lat,g.lon,lat,lon)<=Number(a.target_radius_km||5)});const now=Date.now();rows=rows.filter(a=>now-Number(localStorage.getItem('ic_ad_seen_'+a.id)||0)>=Number(a.frequency_minutes||5)*60000);if(!rows.length)return null;rows.sort((a,b)=>(b.placement==='premium'?1:0)-(a.placement==='premium'?1:0)||Math.random()-.5);const a=rows[0];a.business=map.get(a.business_id);return a}
async function renderAd(){if(typeof main==='undefined'||!main||document.getElementById('icSponsoredAd'))return;const a=await chooseAd();if(!a)return;state.current=a;localStorage.setItem('ic_ad_seen_'+a.id,String(Date.now()));const box=document.createElement('section');box.id='icSponsoredAd';box.className='card';box.style.margin='12px 0';box.innerHTML=`<div class="row between"><span class="pill">${a.placement==='premium'?'⭐ SPONSORISÉ PREMIUM':'📢 SPONSORISÉ'}</span><button class="btn" style="padding:4px 8px" onclick="this.closest('#icSponsoredAd').remove()">×</button></div>${a.image_url?`<img src="${e(a.image_url)}" alt="Publicité locale" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-top:8px" onerror="this.remove()">`:''}<h3 style="margin:10px 0 3px">${e(a.title)}</h3><div class="muted">${e(a.business?.name||'Commerce local')}</div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="openIcSponsoredAd('${e(a.id)}')">En savoir plus</button></div>`;main.prepend(box);track(a.id,'impression')}
window.openIcSponsoredAd=async function(id){const a=state.current?.id===id?state.current:null;if(!a)return;await track(id,'click');const u=safeUrl(a.target_url);if(u)return window.open(u,'_blank','noopener,noreferrer');const b=a.business;if(b&&typeof viewBusiness==='function'){if(!(S.businesses||[]).some(x=>x.id===b.id))S.businesses.push(b);return viewBusiness(b.id)}};
const baseGo=window.go;if(typeof baseGo==='function')window.go=function(page,...args){const r=baseGo.call(this,page,...args);if(page==='home')setTimeout(renderAd,700);return r};
setTimeout(()=>{if(typeof main!=='undefined'&&/Tout Issoire/i.test(main?.innerText||''))renderAd()},1400);

window.newAd=function(bid){const b=biz(bid),p=plan(b);if(!b)return typeof say==='function'?say('Commerce introuvable.'):null;if(!canAds(p))return typeof openIcPlans==='function'?openIcPlans():say('La publicité nécessite Connect Pro ou Pro+.');const max=maxRadius(p),premium=p==='proplus';openModal(`<h2>📢 Nouvelle campagne sponsorisée</h2><div class="notice">${p==='proplus'?'Pro+ : standard ou premium, rayon jusqu’à 50 km.':'Pro : publicité standard, rayon jusqu’à 20 km.'}</div><div class="form"><label>Titre</label><input id="icaTitle" maxlength="120" placeholder="Votre offre ou message"><label>Image URL — facultatif</label><input id="icaImage" placeholder="https://…"><label>Lien cible — facultatif</label><input id="icaUrl" placeholder="https://…"><label>Audience</label><select id="icaAudience"><option value="residents">Habitants</option><option value="professionals">Professionnels</option><option value="all">Tout le monde</option></select><label>Rayon</label><select id="icaRadius">${[2,5,10,20,30,50].filter(x=>x<=max).map(x=>`<option value="${x}" ${x===max?'selected':''}>${x} km</option>`).join('')}</select><label>Placement</label><select id="icaPlacement"><option value="standard">Standard</option>${premium?'<option value="premium">⭐ Premium Pro+</option>':''}</select><div class="two"><div><label>Durée affichage</label><select id="icaDuration"><option value="10">10 s</option><option value="15" selected>15 s</option><option value="20">20 s</option><option value="30">30 s</option></select></div><div><label>Fréquence par appareil</label><select id="icaFreq"><option value="5">5 min</option><option value="15">15 min</option><option value="30" selected>30 min</option><option value="60">60 min</option></select></div></div><label>Fin de campagne — facultatif</label><input id="icaEnd" type="datetime-local"><button class="btn brand" onclick="saveIcAd('${e(bid)}')">Lancer la campagne</button></div>`)};
window.saveIcAd=async function(bid){const title=document.getElementById('icaTitle')?.value.trim();if(!title)return say('Le titre est obligatoire.');const end=document.getElementById('icaEnd')?.value;const payload={business_id:bid,title,image_url:document.getElementById('icaImage')?.value.trim()||null,target_url:document.getElementById('icaUrl')?.value.trim()||null,target_audience:document.getElementById('icaAudience')?.value||'residents',target_radius_km:Number(document.getElementById('icaRadius')?.value||5),placement:document.getElementById('icaPlacement')?.value||'standard',duration_seconds:Number(document.getElementById('icaDuration')?.value||15),frequency_minutes:Number(document.getElementById('icaFreq')?.value||30),starts_at:new Date().toISOString(),ends_at:end?new Date(end).toISOString():null,is_active:true};const {error}=await sb.from('ic_ad_campaigns').insert(payload);if(error)return say(error.message);closeModal();say('Campagne sponsorisée créée.');if(typeof proAccount==='function')proAccount()};
window.openIcAdStats=async function(bid){const {data,error}=await sb.rpc('ic_ad_campaign_stats',{p_business_id:bid});if(error)return say(error.message);const rows=data||[];openModal(`<h2>📊 Statistiques publicitaires</h2>${rows.length?`<div class="cards">${rows.map(r=>`<article class="card"><div class="row between"><div><span class="pill">${e(r.placement)}</span><h3>${e(r.title)}</h3></div><span class="pill">${r.is_active?'🟢 Active':'⚪ Inactive'}</span></div><p>👁 ${Number(r.impressions||0)} impressions · 🖱 ${Number(r.clicks||0)} clics · CTR ${Number(r.ctr||0).toFixed(2).replace('.',',')} %</p><div class="muted">Audience ${e(r.target_audience)} · rayon ${Number(r.target_radius_km||0)} km</div></article>`).join('')}</div>`:'<div class="empty">Aucune campagne publicitaire.</div>'}`)};
function injectProAds(){if(typeof main==='undefined'||!main||document.getElementById('icAdTools'))return;const b=S.myBusinesses?.[0];if(!b)return;const p=plan(b);if(!canAds(p)&&!isAdmin())return;const sec=document.createElement('section');sec.id='icAdTools';sec.className='card';sec.style.marginTop='14px';sec.innerHTML=`<div class="row between"><div><span class="pill">📢 PUBLICITÉ LOCALE</span><h3 style="margin:7px 0 3px">Campagnes & statistiques</h3><div class="muted">${p==='proplus'?'Standard + premium · jusqu’à 50 km':'Standard · jusqu’à 20 km'}</div></div></div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="newAd('${e(b.id)}')">➕ Créer une campagne</button><button class="btn" onclick="openIcAdStats('${e(b.id)}')">📊 Voir les statistiques</button></div>`;main.appendChild(sec)}
for(const name of ['proAccount','adminAccount']){const base=window[name];if(typeof base==='function')window[name]=function(...args){const r=base.apply(this,args);setTimeout(injectProAds,0);return r}}
})();

;/* ===== local-needs-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const RADII=[1,5,10,20,50];
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const logged=()=>!!S.session;
const approximate=n=>Number.isFinite(n)?Math.round(n*100)/100:null; // ~1 km precision, not a house location.
function currentGeo(){try{const x=JSON.parse(localStorage.getItem('ic_resident_geo')||'null');if(x){const latitude=Number(x.lat??x.latitude),longitude=Number(x.lon??x.lng??x.longitude);if(Number.isFinite(latitude)&&Number.isFinite(longitude))return {latitude:approximate(latitude),longitude:approximate(longitude)}}}catch{}return {latitude:null,longitude:null}}
function urgencyLabel(v){return v==='urgent'?'🔴 Urgent':v==='aujourd_hui'?'🟠 Aujourd’hui':'🟢 Normal'}
function needType(v){return ({travaux:'Maison & travaux',auto:'Auto & mobilité',alimentation:'Alimentation / restaurant',sante:'Santé',services:'Services',impression:'Impression / communication',evenement:'Événement',autre:'Autre'})[v]||v||'Autre'}
function radiusOptions(v){const n=RADII.includes(Number(v))?Number(v):10;return RADII.map(x=>`<option value="${x}" ${n===x?'selected':''}>${x} km</option>`).join('')}

window.openIcNeedRequest=function(){
 if(!logged()){if(typeof authModal==='function')return authModal('account');return say('Connectez-vous pour publier une demande.')}
 const p=S.profile||{};
 openModal(`<h2>🙋 J’AI BESOIN DE…</h2><p>Décrivez ce que vous recherchez. Les professionnels <b>Pro 360</b> correspondant à votre zone pourront vous répondre dans Issoire Connect.</p><div class="notice"><b>🔐 Vie privée :</b> ne saisissez pas votre adresse personnelle. Si vous avez autorisé la géolocalisation, seule une position approximative est enregistrée pour le calcul de distance.</div><div class="form"><label>Mon besoin</label><textarea id="icNeedText" maxlength="1000" rows="4" placeholder="Ex. J’ai besoin d’un plombier aujourd’hui pour une fuite, ou d’un chef cuisinier pour une soirée…"></textarea><label>Catégorie</label><select id="icNeedCat"><option value="travaux">Maison & travaux</option><option value="auto">Auto & mobilité</option><option value="alimentation">Alimentation / restaurant</option><option value="sante">Santé</option><option value="services">Services</option><option value="impression">Impression / communication</option><option value="evenement">Événement</option><option value="autre" selected>Autre</option></select><div class="two"><div><label>Urgence</label><select id="icNeedUrg"><option value="normal">Normal</option><option value="aujourd_hui">Aujourd’hui</option><option value="urgent">Urgent</option></select></div><div><label>Rayon</label><select id="icNeedRadius">${radiusOptions(p.radius_km)}</select></div></div><button class="btn brand" onclick="saveIcNeedRequest()">Publier ma demande gratuitement</button></div>`)
};

window.saveIcNeedRequest=async function(){
 if(!logged())return;
 const need_text=document.getElementById('icNeedText')?.value.trim();if(!need_text||need_text.length<5)return say('Décrivez votre besoin en quelques mots.');
 const g=currentGeo(),p=S.profile||{},radius=Number(document.getElementById('icNeedRadius')?.value||10);
 if(!RADII.includes(radius))return say('Rayon invalide.');
 const payload={user_id:S.session.user.id,need_text,category:document.getElementById('icNeedCat')?.value||'autre',urgency:document.getElementById('icNeedUrg')?.value||'normal',radius_km:radius,city:p.city||'Issoire',postal_code:p.postal_code||'63500',latitude:g.latitude,longitude:g.longitude,status:'open'};
 const {error}=await sb.from('ic_needs').insert(payload);if(error)return say(error.message);closeModal();say('Votre demande locale est publiée.');setTimeout(openIcMyNeeds,250)
};

window.openIcMyNeeds=async function(){
 if(!logged())return;openModal('<h2>🙋 Mes demandes locales</h2><div id="icNeedsMine" class="empty">Chargement…</div>');
 const {data,error}=await sb.from('ic_needs').select('*').eq('user_id',S.session.user.id).order('created_at',{ascending:false}).limit(50),host=document.getElementById('icNeedsMine');if(!host)return;if(error){host.innerHTML=`<div class="notice">${e(error.message)}</div>`;return}
 const needs=data||[];if(!needs.length){host.innerHTML='<div class="empty">Aucune demande publiée.</div><div class="actions"><button class="btn brand" onclick="closeModal();openIcNeedRequest()">➕ Publier un besoin</button></div>';return}
 const ids=needs.map(n=>n.id);const {data:responses}=await sb.from('ic_need_responses').select('id,need_id,business_id,message,estimated_price,availability,status,created_at,ic_businesses(name,phone,website)').in('need_id',ids).order('created_at',{ascending:true});const by=new Map();for(const r of responses||[]){if(!by.has(r.need_id))by.set(r.need_id,[]);by.get(r.need_id).push(r)}
 host.innerHTML=`<div class="actions"><button class="btn brand" onclick="closeModal();openIcNeedRequest()">➕ Nouveau besoin</button></div><div class="cards" style="margin-top:10px">${needs.map(n=>{const rs=by.get(n.id)||[];return `<article class="card"><div class="row between"><div><span class="pill">${e(urgencyLabel(n.urgency))}</span><h3 style="margin:7px 0 3px">${e(needType(n.category))}</h3></div><span class="pill">${n.status==='open'?'🟢 Ouverte':n.status==='fulfilled'?'✅ Satisfaite':'⚪ Fermée'}</span></div><p>${e(n.need_text)}</p><div class="muted">📍 ${e(n.city)} · rayon ${Number(n.radius_km)} km · ${new Date(n.created_at).toLocaleDateString('fr-FR')}</div><h4>${rs.length} réponse(s)</h4>${rs.length?rs.map(r=>`<div class="notice" style="margin:7px 0"><b>${e(r.ic_businesses?.name||'Professionnel')}</b>${r.estimated_price!=null?` · env. ${Number(r.estimated_price).toFixed(2).replace('.',',')} €`:''}${r.availability?`<br>🕒 ${e(r.availability)}`:''}<br>${e(r.message)}<br><span class="pill">${e(r.status)}</span>${n.status==='open'&&r.status==='sent'?`<div class="actions"><button class="btn brand" onclick="setIcNeedResponse('${e(r.id)}','accepted')">✅ Choisir cette réponse</button><button class="btn" onclick="setIcNeedResponse('${e(r.id)}','rejected')">Refuser</button></div>`:''}</div>`).join(''):'<div class="muted">Pas encore de réponse.</div>'}${n.status==='open'?`<div class="actions"><button class="btn" onclick="closeIcNeed('${e(n.id)}')">Fermer ma demande</button></div>`:''}</article>`}).join('')}</div>`
};
window.setIcNeedResponse=async function(id,status){const {error}=await sb.rpc('ic_set_need_response_status',{p_response_id:id,p_status:status});if(error)return say(error.message);say(status==='accepted'?'Réponse acceptée.':'Réponse refusée.');openIcMyNeeds()};
window.closeIcNeed=async function(id){const {error}=await sb.from('ic_needs').update({status:'closed',updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);say('Demande fermée.');openIcMyNeeds()};

window.openIcLocalNeeds=async function(bid){
 if(!logged())return;openModal('<h2>📥 Opportunités locales — Pro 360</h2><div id="icNeedsPro" class="empty">Chargement…</div>');
 const {data,error}=await sb.rpc('ic_needs_for_business',{p_business_id:bid}),host=document.getElementById('icNeedsPro');if(!host)return;
 if(error){const upgrade=/Pro 360/i.test(error.message||'');host.innerHTML=`<div class="notice">${e(error.message)}</div>${upgrade?'<div class="actions"><button class="btn brand" onclick="closeModal();openIcPlans()">Voir Pro 360</button></div>':''}`;return}
 const rows=data||[];host.innerHTML=rows.length?`<div class="notice"><b>${rows.length}</b> besoin(s) confirmé(s) correspondant à votre zone.</div><div class="cards">${rows.map(n=>`<article class="card"><div class="row between"><span class="pill">🔥 Besoin confirmé · ${e(urgencyLabel(n.urgency))}</span>${n.distance_km!=null?`<span class="pill">📍 env. ${Number(n.distance_km).toFixed(1)} km</span>`:''}</div><h3>${e(needType(n.category))}</h3><p>${e(n.need_text)}</p><div class="muted">${e(n.city)} · rayon demandé ${Number(n.radius_km)} km · ${new Date(n.created_at).toLocaleString('fr-FR')}</div><div class="actions"><button class="btn brand" onclick="replyIcNeed('${e(n.id)}','${e(bid)}')">${n.already_replied?'✏️ Modifier ma réponse':'💬 Répondre'}</button></div></article>`).join('')}</div>`:'<div class="empty">Aucun besoin confirmé correspondant à votre zone pour le moment.</div>'
};
window.replyIcNeed=function(needId,bid){openModal(`<h2>💬 Répondre au besoin</h2><div class="form"><label>Votre réponse</label><textarea id="icNeedReplyMsg" rows="4" maxlength="1500" placeholder="Expliquez ce que vous pouvez proposer…"></textarea><label>Prix estimatif — facultatif</label><input id="icNeedReplyPrice" type="number" min="0" step="0.01" placeholder="0,00"><label>Disponibilité — facultatif</label><input id="icNeedReplyAvail" maxlength="200" placeholder="Ex. Aujourd’hui après 16 h"><button class="btn brand" onclick="saveIcNeedReply('${e(needId)}','${e(bid)}')">Envoyer ma réponse</button></div>`)};
window.saveIcNeedReply=async function(needId,bid){const message=document.getElementById('icNeedReplyMsg')?.value.trim();if(!message)return say('Écrivez votre réponse.');const raw=document.getElementById('icNeedReplyPrice')?.value,price=raw===''||raw==null?null:Number(raw);const {error}=await sb.rpc('ic_reply_to_need',{p_need_id:needId,p_business_id:bid,p_message:message,p_estimated_price:Number.isFinite(price)?price:null,p_availability:document.getElementById('icNeedReplyAvail')?.value.trim()||null});if(error)return say(error.message);say('Votre réponse a été envoyée à l’habitant.');openIcLocalNeeds(bid)};

function injectHome(){if(typeof main==='undefined'||!main||document.getElementById('icNeedHome'))return;const sec=document.createElement('section');sec.id='icNeedHome';sec.className='card';sec.style.margin='12px 0';sec.innerHTML=`<div class="row between"><div><span class="pill">✨ BESOIN LOCAL</span><h2 style="margin:7px 0 3px">🙋 J’AI BESOIN DE…</h2><p class="muted" style="margin:0">Décrivez votre besoin et laissez les professionnels locaux vous répondre, sans publier votre adresse.</p></div></div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="openIcNeedRequest()">Publier mon besoin</button>${logged()?'<button class="btn" onclick="openIcMyNeeds()">Mes demandes</button>':''}</div>`;main.prepend(sec)}
function injectPro(){if(typeof main==='undefined'||!main||document.getElementById('icNeedProPanel'))return;const b=S.myBusinesses?.[0];if(!b)return;const sec=document.createElement('section');sec.id='icNeedProPanel';sec.className='card';sec.style.marginTop='14px';sec.innerHTML=`<div class="row between"><div><span class="pill">⭐ PRO 360</span><h3 style="margin:7px 0 3px">📥 Besoins confirmés</h3><div class="muted">Répondez aux habitants qui ont réellement publié un besoin correspondant à votre zone.</div></div></div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="openIcLocalNeeds('${e(b.id)}')">Voir les opportunités</button></div>`;main.appendChild(sec)}
function injectAdmin(){if(typeof main==='undefined'||!main||document.getElementById('icNeedAdminPanel')||S.profile?.role!=='admin')return;const sec=document.createElement('section');sec.id='icNeedAdminPanel';sec.className='card';sec.style.marginTop='14px';sec.innerHTML=`<span class="pill">👑 ADMIN</span><h3>Demandes « J’AI BESOIN DE… »</h3><p class="muted">Créez une demande de test ou vérifiez le parcours habitant.</p><div class="actions"><button class="btn brand" onclick="openIcNeedRequest()">Créer une demande de test</button><button class="btn" onclick="openIcMyNeeds()">Mes demandes</button></div>`;main.appendChild(sec)}
const baseGo=window.go;if(typeof baseGo==='function')window.go=function(page,...args){const r=baseGo.call(this,page,...args);if(page==='home')setTimeout(injectHome,750);return r};
for(const name of ['proAccount']){const base=window[name];if(typeof base==='function')window[name]=function(...args){const r=base.apply(this,args);setTimeout(injectPro,0);return r}}
for(const name of ['adminAccount','accountPage']){const base=window[name];if(typeof base==='function')window[name]=function(...args){const r=base.apply(this,args);setTimeout(injectAdmin,0);return r}}
setTimeout(()=>{if(typeof main!=='undefined'&&/Tout Issoire/i.test(main?.innerText||''))injectHome()},1500);
})();

;/* ===== admin-profile-audit-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const escv=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isAdmin=()=>!!(S.session&&S.profile?.role==='admin');
const planCards=()=>`<section id="icAdminPlansProfile" class="card" style="margin:0 0 14px;border:2px solid #1d6fdc"><div class="row between"><div><span class="pill">👑 PROFIL ADMINISTRATEUR</span><h2 style="margin:8px 0 4px">Tous les forfaits sont inclus</h2><p class="muted" style="margin:0">Ton compte admin possède automatiquement les droits maximums sans abonnement Stripe.</p></div><span class="pill">PRO+ EFFECTIF</span></div><div class="cards" style="margin-top:12px"><article class="card"><span class="pill">✅ INCLUS</span><h3>Essential</h3><p>5 km · 20 produits/services · 2 offres/invendus par mois · messagerie.</p></article><article class="card"><span class="pill">✅ INCLUS</span><h3>Pro</h3><p>20 km · catalogue/offres sans limite de forfait · commandes · réservations · emplois · événements · pub standard.</p></article><article class="card"><span class="pill">✅ INCLUS</span><h3>Pro+</h3><p>50 km · toutes les fonctions Pro · quotas maximums · campagnes sponsorisées · notifications maximums.</p></article></div><div class="actions"><button class="btn brand" onclick="openIcPlans()">💳 Voir les 3 forfaits</button><button class="btn" onclick="openIcAdminAudit()">🕘 Historique des corrections</button></div></section>`;
function injectAdminPlans(){if(!isAdmin()||typeof main==='undefined'||!main||document.getElementById('icAdminPlansProfile'))return;main.insertAdjacentHTML('afterbegin',planCards())}
if(typeof window.adminAccount==='function'){
 const base=window.adminAccount;
 window.adminAccount=function(...args){const r=base.apply(this,args);setTimeout(injectAdminPlans,0);return r};
}
if(typeof window.accountPage==='function'){
 const base=window.accountPage;
 window.accountPage=function(...args){const r=base.apply(this,args);setTimeout(injectAdminPlans,0);return r};
}
window.openIcAdminAudit=async function(){
 if(!isAdmin())return typeof say==='function'?say('Accès administrateur requis.'):null;
 if(typeof openModal==='function')openModal('<h2>🕘 Historique des corrections</h2><div id="icAuditRows" class="empty">Chargement…</div>');
 const {data,error}=await sb.from('ic_admin_audit_log').select('id,admin_user_id,action,table_name,record_id,before_data,after_data,created_at').order('created_at',{ascending:false}).limit(100);
 const host=document.getElementById('icAuditRows');if(!host)return;
 if(error){host.innerHTML=`<div class="notice">${escv(error.message)}</div>`;return}
 const rows=data||[];if(!rows.length){host.innerHTML='<div class="empty">Aucune correction administrateur enregistrée pour le moment.</div>';return}
 host.innerHTML=`<div class="notice"><b>${rows.length}</b> dernière(s) action(s) administrateur. Les valeurs avant/après sont conservées pour faciliter les corrections.</div><div class="cards" style="margin-top:10px">${rows.map(r=>`<article class="card"><div class="row between"><div><span class="pill">${escv(r.action)}</span><h3 style="margin:7px 0 3px">${escv(r.table_name)}</h3></div><small>${escv(new Date(r.created_at).toLocaleString('fr-FR'))}</small></div><div class="muted">Enregistrement : ${escv(r.record_id||'—')}</div><div class="actions"><button class="btn" onclick="openIcAdminAuditDetail('${escv(r.id)}')">Voir avant / après</button></div></article>`).join('')}</div>`;
 window.__icAuditRows=rows;
};
window.openIcAdminAuditDetail=function(id){if(!isAdmin())return;const r=(window.__icAuditRows||[]).find(x=>x.id===id);if(!r)return;const fmt=o=>o?escv(JSON.stringify(o,null,2)):'—';openModal(`<h2>🧾 Détail de la correction</h2><p><b>${escv(r.table_name)}</b> · ${escv(r.action)} · ${escv(new Date(r.created_at).toLocaleString('fr-FR'))}</p><h3>Avant</h3><pre style="white-space:pre-wrap;max-height:260px;overflow:auto;background:#f6f8fb;padding:10px;border-radius:10px">${fmt(r.before_data)}</pre><h3>Après</h3><pre style="white-space:pre-wrap;max-height:260px;overflow:auto;background:#f6f8fb;padding:10px;border-radius:10px">${fmt(r.after_data)}</pre><div class="actions"><button class="btn" onclick="closeModal()">Fermer</button></div>`)};
setTimeout(injectAdminPlans,0);
})();

;/* ===== account-security-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
const logged=()=>!!S.session;
function panel(){if(!logged())return '';const admin=S.profile?.role==='admin';return `<section id="icAccountSecurity" class="card" style="margin-top:16px"><div class="row between"><div><span class="pill">🔐 COMPTE & SÉCURITÉ</span><h3 style="margin:7px 0 3px">Gérer mon compte</h3><div class="muted">Profil, email, mot de passe et confidentialité.</div></div></div><div class="actions" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px"><button class="btn" onclick="openIcProfileSettings()">👤 Modifier mon profil</button><button class="btn" onclick="openIcChangeEmail()">✉️ Changer mon email</button><button class="btn" onclick="openIcChangePassword()">🔑 Changer mon mot de passe</button>${admin?'<span class="pill">🛡 Compte admin protégé contre l’auto-suppression</span>':'<button class="btn" onclick="openIcDeleteAccount()">🗑 Supprimer mon compte</button>'}</div></section>`}
function inject(){if(!logged()||typeof main==='undefined'||!main||document.getElementById('icAccountSecurity'))return;main.insertAdjacentHTML('beforeend',panel())}
for(const name of ['accountPage','proAccount','adminAccount']){const base=window[name];if(typeof base==='function')window[name]=function(...args){const r=base.apply(this,args);setTimeout(inject,0);return r}}
window.openIcProfileSettings=function(){if(!logged())return;const p=S.profile||{};openModal(`<h2>👤 Modifier mon profil</h2><div class="form"><label>Nom affiché</label><input id="icpName" maxlength="120" value="${e(p.display_name||'')}"><label>Ville</label><input id="icpCity" maxlength="100" value="${e(p.city||'Issoire')}"><label>Code postal</label><input id="icpPostal" maxlength="10" value="${e(p.postal_code||'63500')}"><label>Rayon de découverte</label><select id="icpRadius">${[2,5,10,20,30,50].map(x=>`<option value="${x}" ${Number(p.radius_km||10)===x?'selected':''}>${x} km</option>`).join('')}</select><button class="btn brand" onclick="saveIcProfileSettings()">💾 Enregistrer</button></div>`)};
window.saveIcProfileSettings=async function(){if(!logged())return;const payload={display_name:document.getElementById('icpName')?.value.trim()||null,city:document.getElementById('icpCity')?.value.trim()||'Issoire',postal_code:document.getElementById('icpPostal')?.value.trim()||null,radius_km:Number(document.getElementById('icpRadius')?.value||10),updated_at:new Date().toISOString()};const {data,error}=await sb.from('ic_profiles').update(payload).eq('id',S.session.user.id).select('*').single();if(error)return say(error.message);S.profile=data;closeModal();say('Profil mis à jour.');if(typeof go==='function')go('account')};
window.openIcChangeEmail=function(){if(!logged())return;openModal(`<h2>✉️ Changer mon email</h2><p class="muted">Adresse actuelle : ${e(S.session.user.email||'')}</p><div class="form"><input id="iceNewEmail" type="email" autocomplete="email" placeholder="Nouvelle adresse email"><button class="btn brand" onclick="saveIcNewEmail()">Envoyer la confirmation</button></div>`)};
window.saveIcNewEmail=async function(){const email=document.getElementById('iceNewEmail')?.value.trim();if(!email||!email.includes('@'))return say('Adresse email invalide.');const {error}=await sb.auth.updateUser({email});if(error)return say(error.message);closeModal();say('Un email de confirmation a été envoyé. Le changement sera effectif après validation.')};
window.openIcChangePassword=function(){if(!logged())return;openModal(`<h2>🔑 Changer mon mot de passe</h2><div class="form"><input id="icPwd1" type="password" autocomplete="new-password" minlength="12" placeholder="Nouveau mot de passe — 12 caractères minimum"><input id="icPwd2" type="password" autocomplete="new-password" minlength="12" placeholder="Confirmer le mot de passe"><button class="btn brand" onclick="saveIcNewPassword()">Mettre à jour le mot de passe</button></div>`)};
window.saveIcNewPassword=async function(){const a=document.getElementById('icPwd1')?.value||'',b=document.getElementById('icPwd2')?.value||'';if(a.length<12)return say('Utilisez au moins 12 caractères.');if(a!==b)return say('Les deux mots de passe ne correspondent pas.');const {error}=await sb.auth.updateUser({password:a});if(error)return say(error.message);closeModal();say('Mot de passe modifié.')};
window.openIcPasswordReset=function(prefill=''){openModal(`<h2>🔑 Mot de passe oublié</h2><p>Entrez l’adresse email du compte. Vous recevrez un lien sécurisé de récupération.</p><div class="form"><input id="icResetEmail" type="email" autocomplete="email" value="${e(prefill)}" placeholder="votre@email.fr"><button class="btn brand" onclick="sendIcPasswordReset()">Envoyer le lien</button></div>`)};
window.sendIcPasswordReset=async function(){const email=document.getElementById('icResetEmail')?.value.trim();if(!email||!email.includes('@'))return say('Adresse email invalide.');const redirectTo=location.origin+location.pathname;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});if(error)return say(error.message);closeModal();say('Si ce compte existe, un email de récupération vient d’être envoyé.')};
window.openIcDeleteAccount=function(){if(!logged())return;if(S.profile?.role==='admin')return say('La suppression automatique d’un compte administrateur est bloquée par sécurité.');openModal(`<h2>🗑 Supprimer mon compte</h2><div class="notice"><b>Action définitive.</b><br>Vos données Issoire Connect seront supprimées. Les commandes historiques seront anonymisées. Un abonnement professionnel actif doit d’abord être annulé.</div><p>Tapez <b>SUPPRIMER</b> pour confirmer.</p><div class="form"><input id="icDeleteConfirm" autocomplete="off" placeholder="SUPPRIMER"><button id="icDeleteBtn" class="btn primary" onclick="deleteIcAccount()">Supprimer définitivement mon compte</button></div>`)};
window.deleteIcAccount=async function(){if(!logged()||S.profile?.role==='admin')return;const confirm=document.getElementById('icDeleteConfirm')?.value.trim();if(confirm!=='SUPPRIMER')return say('Tapez SUPPRIMER pour confirmer.');const btn=document.getElementById('icDeleteBtn');if(btn){btn.disabled=true;btn.textContent='Suppression…'}const {data,error}=await sb.functions.invoke('ic-delete-account',{body:{confirm:'DELETE_ISSOIRE_CONNECT_ACCOUNT'}});if(error){if(btn){btn.disabled=false;btn.textContent='Supprimer définitivement mon compte'}const msg=data?.error||error.message||'Suppression impossible.';if(msg==='active_subscription_must_be_cancelled')return say('Annulez d’abord votre abonnement professionnel actif.');if(msg==='shared_signal_deal_identity_detected')return say('Ce même identifiant est utilisé par un autre service Altéra/Signal Deal : suppression manuelle nécessaire pour ne pas supprimer l’autre service.');return say(msg)}try{await sb.auth.signOut()}catch{};location.href=location.origin+location.pathname};
const baseAuth=window.authModal;if(typeof baseAuth==='function')window.authModal=function(...args){const r=baseAuth.apply(this,args);setTimeout(()=>{if(document.getElementById('icForgotPasswordBtn'))return;const pass=[...document.querySelectorAll('input[type="password"]')].find(x=>x.offsetParent!==null);if(!pass)return;const btn=document.createElement('button');btn.id='icForgotPasswordBtn';btn.type='button';btn.className='btn';btn.textContent='Mot de passe oublié ?';btn.onclick=()=>{const email=[...document.querySelectorAll('input[type="email"]')].find(x=>x.offsetParent!==null)?.value||'';openIcPasswordReset(email)};pass.parentElement?.appendChild(btn)},0);return r};
try{sb.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setTimeout(()=>openIcChangePassword(),50)})}catch{}
setTimeout(inject,0);
})();

;/* ===== auth-flow-patch-v40.js ===== */
(()=>{
if(typeof window==='undefined'||typeof sb==='undefined')return;

const PRIMARY_APP_URL='https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const PENDING_EMAIL_KEY='ic_pending_confirmation_email';
const RESEND_UNTIL_KEY='ic_confirmation_resend_until';
let mode='login';
let nextPage='account';

const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const q=id=>document.getElementById(id);
function redirectUrl(){
 try{
  if(location.hostname==='djerhemiank-source.github.io')return PRIMARY_APP_URL;
  return location.origin+location.pathname;
 }catch{return PRIMARY_APP_URL}
}
function pendingEmail(){try{return localStorage.getItem(PENDING_EMAIL_KEY)||''}catch{return ''}}
function setPendingEmail(email){try{localStorage.setItem(PENDING_EMAIL_KEY,email||'')}catch{}}
function clearPending(){try{localStorage.removeItem(PENDING_EMAIL_KEY);localStorage.removeItem(RESEND_UNTIL_KEY)}catch{}}
function resendUntil(){try{return Number(localStorage.getItem(RESEND_UNTIL_KEY)||0)}catch{return 0}}
function setResendCooldown(ms=60000){try{localStorage.setItem(RESEND_UNTIL_KEY,String(Date.now()+ms))}catch{}}
function secondsLeft(){return Math.max(0,Math.ceil((resendUntil()-Date.now())/1000))}
function friendlyError(err){
 const code=String(err?.code||'').toLowerCase(),msg=String(err?.message||'').toLowerCase();
 if(code==='email_not_confirmed'||msg.includes('email not confirmed'))return 'Votre compte existe, mais votre adresse email n’est pas encore confirmée.';
 if(code==='invalid_credentials'||msg.includes('invalid login credentials'))return 'Email ou mot de passe incorrect.';
 if(code==='over_email_send_rate_limit'||msg.includes('security purposes')||msg.includes('rate limit'))return 'Un email vient déjà d’être envoyé. Attendez environ une minute avant d’en demander un autre.';
 if(code==='user_already_exists'||msg.includes('already registered'))return 'Un compte existe déjà avec cette adresse email. Utilisez Connexion ou Mot de passe oublié.';
 return err?.message||'La connexion a échoué.';
}
function setInfo(html){const n=q('authInfo');if(n)n.innerHTML=html}
function updateResendButton(){
 const btn=q('icResendConfirm');if(!btn)return;
 const left=secondsLeft();btn.disabled=left>0;btn.textContent=left>0?`Renvoyer l’email dans ${left} s`:'Renvoyer l’email de confirmation';
 if(left>0)setTimeout(updateResendButton,1000);
}
function confirmationPanel(email,message=''){return `<div class="notice" style="margin-top:8px"><b>✉️ Confirmez votre adresse email</b><br>${message?e(message)+'<br>':''}Nous avons envoyé un email à <b>${e(email)}</b>.<br><br><b>Important :</b> ouvrez le <u>dernier email reçu</u>. Les anciens liens peuvent devenir invalides après un nouvel envoi.</div><div class="actions" style="margin-top:10px"><button id="icResendConfirm" type="button" class="btn" onclick="resendIcSignupConfirmation()">Renvoyer l’email de confirmation</button><button type="button" class="btn" onclick="authMode('login')">J’ai confirmé mon email</button></div>`}
function showPending(email,message=''){
 setPendingEmail(email);setInfo(confirmationPanel(email,message));updateResendButton();
}

window.authModal=function(next='account'){
 nextPage=next||'account';mode='login';
 const pe=pendingEmail();
 openModal(`<h2>Connexion à Issoire Connect</h2><div class="tabs"><button id="loginTab" class="active" onclick="authMode('login')">Connexion</button><button id="signupTab" onclick="authMode('signup')">Créer un compte</button></div><div class="form"><div id="nameWrap" style="display:none"><label>Nom</label><input id="authName" autocomplete="name"></div><label>Email</label><input id="authEmail" type="email" autocomplete="email" value="${e(pe)}"><label>Mot de passe</label><input id="authPass" type="password" autocomplete="current-password" placeholder="8 caractères minimum"><button id="authGo" class="btn brand" onclick="doAuth()">Se connecter</button><button type="button" class="btn" onclick="openIcPasswordReset(document.getElementById('authEmail')?.value||'')">Mot de passe oublié ?</button><div id="authInfo" class="muted">${pe?confirmationPanel(pe):'Connectez-vous à votre compte.'}</div></div>`);
 updateResendButton();
};

window.authMode=function(m){
 mode=m==='signup'?'signup':'login';
 q('loginTab')?.classList.toggle('active',mode==='login');q('signupTab')?.classList.toggle('active',mode==='signup');
 const name=q('nameWrap'),pass=q('authPass'),go=q('authGo');if(name)name.style.display=mode==='signup'?'block':'none';
 if(pass)pass.autocomplete=mode==='signup'?'new-password':'current-password';
 if(go)go.textContent=mode==='signup'?'Créer mon compte':'Se connecter';
 setInfo(mode==='signup'?'Compte habitant gratuit. Vous pourrez activer ensuite votre espace professionnel sur ce même compte.':'Connectez-vous à votre compte.');
};

window.resendIcSignupConfirmation=async function(){
 const email=(q('authEmail')?.value||pendingEmail()).trim();if(!email||!email.includes('@'))return say('Indiquez votre adresse email.');
 const left=secondsLeft();if(left>0){updateResendButton();return say(`Attendez encore ${left} seconde(s).`)}
 const btn=q('icResendConfirm');if(btn){btn.disabled=true;btn.textContent='Envoi…'}
 const {error}=await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectUrl()}});
 if(error){if(btn)btn.disabled=false;setInfo(confirmationPanel(email,friendlyError(error)));updateResendButton();return say(friendlyError(error))}
 setPendingEmail(email);setResendCooldown();setInfo(confirmationPanel(email,'Un nouvel email vient d’être envoyé.'));updateResendButton();say('Email de confirmation renvoyé.');
};

window.doAuth=async function(){
 const email=(q('authEmail')?.value||'').trim(),password=q('authPass')?.value||'';
 if(!email||!email.includes('@')||password.length<8)return say('Email valide et mot de passe de 8 caractères minimum.');
 const btn=q('authGo');if(btn){btn.disabled=true;btn.textContent=mode==='signup'?'Création…':'Connexion…'}
 try{
  let r;
  if(mode==='signup'){
   const name=(q('authName')?.value||'').trim();
   r=await sb.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl(),data:{display_name:name,role:'resident'}}});
  }else r=await sb.auth.signInWithPassword({email,password});
  if(r.error){
   const msg=friendlyError(r.error);
   if(String(r.error.code||'').toLowerCase()==='email_not_confirmed'||String(r.error.message||'').toLowerCase().includes('email not confirmed')){showPending(email,msg);return}
   setInfo(`<span style="color:#b42318">${e(msg)}</span>`);say(msg);return;
  }
  if(!r.data?.session){setResendCooldown();showPending(email,'Votre compte a été créé.');say('Compte créé : confirmez maintenant votre email.');return}
  clearPending();S.session=r.data.session;closeModal();if(typeof loadPrivate==='function')await loadPrivate();say('Connecté');if(typeof go==='function')go(nextPage||'account');
 }finally{if(btn){btn.disabled=false;btn.textContent=mode==='signup'?'Créer mon compte':'Se connecter'}}
};

try{
 sb.auth.onAuthStateChange(async(event,session)=>{
  if(event==='SIGNED_IN'&&session){
   clearPending();
   const fromEmail=location.hash.includes('access_token')||location.hash.includes('type=signup')||/[?&](code|token_hash)=/.test(location.search);
   if(fromEmail){
    try{S.session=session;if(typeof loadPrivate==='function')await loadPrivate();if(typeof closeModal==='function')closeModal();if(typeof go==='function')go('account');if(typeof say==='function')say('Email confirmé. Bienvenue sur Issoire Connect.');history.replaceState(null,document.title,location.pathname)}catch{}
   }
  }
 });
}catch{}

// If Supabase redirected an auth error back to the app, show a useful message instead of leaving the user on a broken-looking page.
setTimeout(()=>{
 try{
  const p=new URLSearchParams(location.hash.replace(/^#/,''));const code=p.get('error_code')||'';const desc=p.get('error_description')||'';
  if(code||desc){authModal('account');setInfo(`<div class="notice"><b>Le lien de confirmation n’est plus valable.</b><br>${e(desc||'Utilisez le dernier email de confirmation reçu, ou demandez-en un nouveau ci-dessus.')}</div>${pendingEmail()?confirmationPanel(pendingEmail()):''}`);updateResendButton()}
 }catch{}
},500);
})();


;/* ===== push-notifications-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const logged=()=>!!S.session;
function b64ToU8(base64){const padding='='.repeat((4-base64.length%4)%4),raw=atob((base64+padding).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
function keyToB64(key){return btoa(String.fromCharCode(...new Uint8Array(key))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function reg(){if(!('serviceWorker'in navigator))throw new Error('Service Worker non pris en charge sur cet appareil.');return await navigator.serviceWorker.ready}
async function status(){if(!('Notification'in window)||!('PushManager'in window))return {supported:false,permission:'unsupported',active:false};const r=await reg();const s=await r.pushManager.getSubscription();return {supported:true,permission:Notification.permission,active:!!s}}
async function render(){const host=document.getElementById('icPushPanel');if(!host)return;let s;try{s=await status()}catch(err){host.innerHTML=`<div class="notice">Notifications indisponibles : ${String(err?.message||err)}</div>`;return}if(!s.supported){host.innerHTML='<div class="notice">Ce navigateur ne prend pas en charge les notifications Push.</div>';return}host.innerHTML=`<div class="row between"><div><span class="pill">🔔 NOTIFICATIONS</span><h3 style="margin:7px 0 3px">Notifications téléphone / PC</h3><div class="muted">État : ${s.active?'🟢 activées':s.permission==='denied'?'🔴 refusées':'⚪ non activées'}</div></div></div><div class="actions" style="margin-top:10px">${s.active?'<button class="btn" onclick="disableIcPush()">Désactiver</button><button class="btn brand" onclick="testIcPush()">Envoyer un test</button>':'<button class="btn brand" onclick="enableIcPush()">Activer les notifications</button>'}</div>`}
function inject(){if(!logged()||typeof main==='undefined'||!main||document.getElementById('icPushPanel'))return;const sec=document.createElement('section');sec.id='icPushPanel';sec.className='card';sec.style.marginTop='16px';sec.innerHTML='<div class="empty">Vérification des notifications…</div>';main.appendChild(sec);render()}
for(const name of ['accountPage','proAccount','adminAccount']){const base=window[name];if(typeof base==='function')window[name]=function(...args){const r=base.apply(this,args);setTimeout(inject,0);return r}}
window.enableIcPush=async function(){if(!logged())return say('Connectez-vous d’abord.');try{if(Notification.permission==='denied')throw new Error('Les notifications sont bloquées dans les réglages du navigateur.');const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Autorisation de notification non accordée.');const registration=await reg();let sub=await registration.pushManager.getSubscription();if(!sub){const {data:key,error:keyError}=await sb.rpc('ic_webpush_public_key');if(keyError||!key)throw new Error(keyError?.message||'Clé Push indisponible.');sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToU8(key)})}const p=sub.getKey('p256dh'),a=sub.getKey('auth');if(!p||!a)throw new Error('Clés Push indisponibles.');const {error}=await sb.rpc('ic_upsert_push_subscription',{p_endpoint:sub.endpoint,p_p256dh:keyToB64(p),p_auth_key:keyToB64(a),p_user_agent:navigator.userAgent});if(error)throw error;say('Notifications activées sur cet appareil.');await render()}catch(err){say(err?.message||String(err))}};
window.disableIcPush=async function(){try{const registration=await reg();const sub=await registration.pushManager.getSubscription();if(sub){await sb.rpc('ic_disable_push_subscription',{p_endpoint:sub.endpoint});await sub.unsubscribe()}say('Notifications désactivées sur cet appareil.');await render()}catch(err){say(err?.message||String(err))}};
window.testIcPush=async function(){if(!logged())return;try{const {data,error}=await sb.functions.invoke('ic-test-push',{body:{}});if(error)throw error;if(!data?.sent)throw new Error(data?.error||'Aucune notification de test envoyée.');say(`Notification de test envoyée (${data.sent}).`)}catch(err){say(err?.message||String(err))}};
setTimeout(inject,0);
})();

;/* ===== member-benefits-patch.js ===== */
(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
const owned=id=>(S.myBusinesses||[]).find(b=>b.id===id&&S.session&&b.owner_id===S.session.user.id);
const activeBenefits=bid=>(S.offers||[]).filter(o=>o.business_id===bid&&o.member_only===true&&o.is_active!==false&&(!o.ends_at||new Date(o.ends_at)>=new Date()));
const benefitLabel=o=>{
 const k=o?.benefit_kind,v=Number(o?.benefit_value||0),t=o?.benefit_text||'';
 if(k==='percent'&&v)return `-${v}%`;
 if(k==='fixed'&&v)return `-${v} €`;
 if(k==='gift')return t||'Cadeau offert';
 if(k==='service')return t||'Service offert';
 if(k==='loyalty')return t||'Avantage fidélité';
 return 'Avantage membre';
};
window.openIcMemberBenefit=function(bid){
 const b=owned(bid);if(!b)return typeof say==='function'?say('Accès refusé.'):null;
 const html=`<h2>🎁 Avantage Issoire Connect</h2><p class="muted">Proposez un avantage exclusif aux utilisateurs de l’application. Il peut s’agir d’une remise, d’une réduction, d’un cadeau, d’un service offert ou d’un avantage fidélité.</p><div class="form"><label>Titre</label><input id="icbTitle" placeholder="Ex. -10 % sur votre première visite"><label>Type d’avantage</label><select id="icbKind" onchange="icBenefitKindChanged()"><option value="percent">Remise en %</option><option value="fixed">Réduction en €</option><option value="gift">Cadeau offert</option><option value="service">Service offert</option><option value="loyalty">Avantage fidélité</option></select><div id="icbValueWrap"><label>Valeur</label><input id="icbValue" type="number" min="0" step="0.01" placeholder="10"></div><label>Texte de l’avantage</label><input id="icbText" placeholder="Ex. séance découverte offerte"><label>Description</label><textarea id="icbDesc" rows="4" placeholder="Expliquez l’offre et ce qu’elle apporte."></textarea><label>Conditions</label><textarea id="icbCond" rows="3" placeholder="Ex. sur présentation de l’application, hors promotions en cours…"></textarea><label>Prix habituel (facultatif)</label><input id="icbOriginal" type="number" min="0" step="0.01"><label>Date de fin (facultatif)</label><input id="icbEnd" type="date"><button class="btn brand" onclick="saveIcMemberBenefit('${e(bid)}')">Publier l’avantage</button></div><div class="notice" style="margin-top:12px">L’avantage sera identifié comme <b>réservé aux utilisateurs Issoire Connect</b>. Le professionnel reste responsable des conditions et du respect du prix annoncé.</div>`;
 if(typeof openModal==='function')openModal(html);
};
window.icBenefitKindChanged=function(){const k=document.getElementById('icbKind')?.value,w=document.getElementById('icbValueWrap');if(w)w.style.display=(k==='percent'||k==='fixed')?'block':'none'};
window.saveIcMemberBenefit=async function(bid){
 const b=owned(bid);if(!b)return typeof say==='function'?say('Accès refusé.'):null;
 const title=document.getElementById('icbTitle')?.value.trim()||'',kind=document.getElementById('icbKind')?.value||'percent',value=Number(document.getElementById('icbValue')?.value||0),benefitText=document.getElementById('icbText')?.value.trim()||'',description=document.getElementById('icbDesc')?.value.trim()||'',conditions=document.getElementById('icbCond')?.value.trim()||'',original=Number(document.getElementById('icbOriginal')?.value||0),end=document.getElementById('icbEnd')?.value||'';
 if(!title)return typeof say==='function'?say('Ajoutez un titre à l’avantage.'):null;
 if((kind==='percent'||kind==='fixed')&&!(value>0))return typeof say==='function'?say('Indiquez la valeur de la remise.'):null;
 let sale=null;if(original>0&&kind==='percent')sale=Math.max(0,Math.round((original*(1-value/100))*100)/100);if(original>0&&kind==='fixed')sale=Math.max(0,Math.round((original-value)*100)/100);
 const payload={business_id:bid,offer_type:'promotion',title:`🎁 ${title}`,description:description||null,original_price:original||null,sale_price:sale,quantity:null,starts_at:new Date().toISOString(),ends_at:end?new Date(end+'T23:59:59').toISOString():null,pickup_deadline:null,is_active:true,category:'Avantage Issoire Connect',price_label:benefitLabel({benefit_kind:kind,benefit_value:value,benefit_text:benefitText}),source_type:'merchant',source_name:'Issoire Connect',source_url:null,source_offer_key:null,source_checked_at:null,reservation_enabled:false,payment_required:false,member_only:true,benefit_kind:kind,benefit_value:(kind==='percent'||kind==='fixed')?value:null,benefit_text:benefitText||null,conditions:conditions||null};
 const {error}=await sb.from('ic_offers').insert(payload);if(error)return typeof say==='function'?say(error.message):null;
 if(typeof closeModal==='function')closeModal();if(typeof say==='function')say('Avantage Issoire Connect publié.');if(typeof refresh==='function')await refresh();if(typeof proAccount==='function')proAccount();
};
const basePro=typeof proAccount==='function'?proAccount:null;
if(basePro)window.proAccount=function(...args){const r=basePro(...args);setTimeout(()=>{if(typeof main==='undefined'||document.getElementById('icMemberBenefitsPanel'))return;const businesses=S.myBusinesses||[];if(!businesses.length)return;const box=document.createElement('section');box.id='icMemberBenefitsPanel';box.className='card';box.style.marginBottom='14px';box.innerHTML=`<div class="sectionhead"><div><span class="pill">🎁 AVANTAGES MEMBRES</span><h2>Faites préférer votre établissement</h2><p>Proposez au moins un avantage réservé aux utilisateurs Issoire Connect : remise, réduction, cadeau, service offert ou fidélité.</p></div></div><div class="cards">${businesses.map(b=>{const a=activeBenefits(b.id);return `<article class="card"><div class="row between"><div><h3>${e(b.name)}</h3><div class="muted">${a.length?`${a.length} avantage(s) actif(s)`:'Aucun avantage actif pour le moment'}</div></div><button class="btn brand" onclick="openIcMemberBenefit('${e(b.id)}')">+ Créer un avantage</button></div>${a.length?`<div style="margin-top:10px">${a.slice(0,3).map(o=>`<span class="pill" style="margin:3px">🎁 ${e(benefitLabel(o))}</span>`).join('')}</div>`:'<div class="notice" style="margin-top:10px">Un avantage actif permet d’être identifié comme partenaire offrant un bénéfice concret aux habitants.</div>'}</article>`}).join('')}</div>`;main.prepend(box)},0);return r};
const baseCard=typeof businessCard==='function'?businessCard:null;
if(baseCard)window.businessCard=function(b){let h=baseCard(b);if(activeBenefits(b.id).length)h=h.replace('</h3>',` <span class="pill" style="margin-left:5px">🎁 Avantage IC</span></h3>`);return h};
const baseView=typeof viewBusiness==='function'?viewBusiness:null;
if(baseView)window.viewBusiness=function(id){baseView(id);const list=activeBenefits(id);if(!list.length||typeof modalBody==='undefined'||!modalBody)return;modalBody.insertAdjacentHTML('beforeend',`<div class="notice" style="margin-top:12px"><b>🎁 Avantages Issoire Connect</b><div style="display:grid;gap:8px;margin-top:8px">${list.map(o=>`<div><strong>${e(o.title)}</strong><br><span>${e(benefitLabel(o))}</span>${o.conditions?`<br><small>${e(o.conditions)}</small>`:''}</div>`).join('')}</div></div>`)};
})();

;/* ===== subscription-v32.js ===== */
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
 const full=isLegacyFull(cur);
 return `<div class="cards"><div class="plan"><span class="pill">PRO LOCAL</span><h3>Pro Local</h3><div class="amount">4,99 € <small>/mois</small></div><p class="muted"><b>Être trouvé.</b><br>Fiche Pro · produits/services · Avantages IC · emplois · visibilité locale.</p>${cur===LOCAL?'<span class="pill">Formule actuelle</span>':logged?'<button class="btn brand" onclick="startIcPlanCheckout(\'essential\')">Choisir Pro Local</button>':'<button class="btn brand" onclick="authModal(\'account\')">Créer un compte pro</button>'}</div><div class="plan pop"><span class="pill">⭐ TOUT INCLUS</span><h3>Pro 360</h3><div class="amount">19,99 € <small>/mois</small></div><p class="muted"><b>Trouver des clients.</b><br>Tout Pro Local + Radar Prospects · CRM · pipeline · opportunités · ciblage · campagnes.</p>${full?'<span class="pill">Formule actuelle</span>':logged?'<button class="btn brand" onclick="startIcPlanCheckout(\'proplus\')">Choisir Pro 360</button>':'<button class="btn brand" onclick="authModal(\'account\')">Créer un compte pro</button>'}</div></div>`;
};

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

;/* ===== v40-core-patch.js ===== */
(()=>{
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const RADII=[1,5,10,20,50];
const V={items:[],last:null};
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const logged=()=>!!S.session;
const pro360=()=>typeof window.icHasPro360==='function'?window.icHasPro360():S.profile?.role==='admin'||['pro','proplus'].includes(S.subscription?.plan||'');
function radiusOptions(value=20,zero=false){const vals=zero?[0,...RADII]:RADII;return vals.map(x=>`<option value="${x}" ${Number(value)===x?'selected':''}>${x===0?'Toutes distances':x+' km'}</option>`).join('')}
function normalizeSelect(id,value){const el=document.getElementById(id);if(!el)return;const current=Number(value??el.value??10);const best=RADII.includes(current)?current:(current<=1?1:current<=5?5:current<=10?10:current<=20?20:50);el.innerHTML=radiusOptions(best);el.value=String(best)}
function currentBusiness(){return (S.myBusinesses||[])[0]||null}
async function invokeRadar(body){
 let timer;
 try{return await Promise.race([
  sb.functions.invoke('ic-prospect-radar',{body}),
  new Promise(resolve=>{timer=setTimeout(()=>resolve({data:null,error:{message:'Le Radar met trop de temps à répondre. Réessayez dans quelques secondes.'}}),15000)})
 ])}finally{clearTimeout(timer)}
}

window.openIcProspectRadarV40=async function(){
 if(!logged()){if(typeof authModal==='function')return authModal('account');return say('Connectez-vous pour utiliser le Radar Prospects.');}
 if(!pro360()){if(typeof openIcPlans==='function')return openIcPlans();return say('Le Radar Prospects nécessite Pro 360.');}
 let pref=null;try{const {data}=await sb.from('ic_prospect_preferences').select('*').eq('user_id',S.session.user.id).maybeSingle();pref=data}catch{}
 const b=currentBusiness(),p=S.profile||{};
 const profession=pref?.profession||b?.category||'';
 const city=pref?.city||p.city||b?.city||'Issoire';
 const postal=pref?.postal_code||p.postal_code||b?.postal_code||'63500';
 const radius=RADII.includes(Number(pref?.radius_km))?Number(pref.radius_km):20;
 openModal(`<h2>🎯 Radar Prospects — Pro 360</h2><p>Trouvez des opportunités locales à partir des besoins publiés dans Issoire Connect et des entreprises compatibles de votre zone.</p><div class="notice"><b>🔥 Besoin confirmé</b> = demande réellement publiée. <b>🔵 Cible compatible</b> = prospect pertinent à qualifier, sans besoin supposé comme certain.</div><div class="form"><label>Votre métier / activité</label><input id="icV40Profession" maxlength="160" value="${e(profession)}" placeholder="Ex. chef cuisinier, plombier, photographe…"><div class="two"><div><label>Ville</label><input id="icV40City" value="${e(city)}"></div><div><label>Code postal</label><input id="icV40Postal" value="${e(postal)}"></div></div><label>Rayon</label><select id="icV40Radius">${radiusOptions(radius)}</select><button id="icV40Run" class="btn brand" onclick="runIcProspectRadarV40()">🎯 Lancer le Radar Prospects</button></div>`);
};

window.runIcProspectRadarV40=async function(){
 if(!logged()||!pro360())return openIcProspectRadarV40();
 const profession=document.getElementById('icV40Profession')?.value.trim()||'',city=document.getElementById('icV40City')?.value.trim()||'Issoire',postal_code=document.getElementById('icV40Postal')?.value.trim()||'',radius_km=Number(document.getElementById('icV40Radius')?.value||20);
 if(profession.length<2)return say('Indiquez votre métier ou votre activité.');
 const btn=document.getElementById('icV40Run');if(btn){btn.disabled=true;btn.textContent='Recherche en cours…'}
 let geo=null;try{geo=JSON.parse(localStorage.getItem('ic_resident_geo')||'null')}catch{}
 const body={profession,city,postal_code,radius_km};if(geo){const lat=Number(geo.lat??geo.latitude),lon=Number(geo.lon??geo.lng??geo.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon)){body.latitude=lat;body.longitude=lon}}
 const {data,error}=await invokeRadar(body);
 if(error){if(btn){btn.disabled=false;btn.textContent='🎯 Lancer le Radar Prospects'};const msg=String(error.message||'');if(/403|pro360/i.test(msg)){closeModal();return openIcPlans()}return say('Radar indisponible : '+msg)}
 if(data?.error==='pro360_required'){closeModal();return openIcPlans()}
 V.items=Array.isArray(data?.items)?data.items:[];V.last={profession,city,postal_code,radius_km};closeModal();renderIcProspectRadarV40(data);
};

function leadCard(x,i){
 const need=x.proof_level==='confirmed_need',d=x.distance_km!=null?` · 📍 ${Number(x.distance_km).toFixed(1)} km`:'';
 const b=currentBusiness();
 const reply=need&&b&&String(x.key||'').startsWith('need:')?`<button class="btn brand" onclick="replyIcNeed('${e(String(x.key).slice(5))}','${e(b.id)}')">💬 Répondre</button>`:'';
 return `<article class="card" style="border-top:4px solid ${need?'#f47721':'#1677d2'}"><div class="row between"><span class="pill">${e(x.proof_label||'Prospect')}</span><span class="pill">${Number(x.score||0)} %</span></div><h3>${e(x.title||x.company||'Opportunité')}</h3><div class="muted">${e(x.company||'')}${x.city?' · '+e(x.city):''}${d}</div>${x.why_target?`<p>${e(x.why_target)}</p>`:''}${x.why_now?`<div class="notice">${e(x.why_now)}</div>`:''}<div class="actions" style="margin-top:10px">${reply}<button class="btn" onclick="saveIcProspectV40(${i})">👥 Ajouter aux prospects</button></div></article>`;
}
window.renderIcProspectRadarV40=function(data={}){
 if(typeof main==='undefined'||!main)return;
 const zone=data.zone||V.last||{},items=V.items;
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">⭐ PRO 360</span><h2 style="margin-top:8px">🎯 Radar Prospects</h2><p>${e(data.profession||V.last?.profession||'')} · ${e(zone.city||'Issoire')} · ${Number(zone.radius_km||20)} km</p></div><button class="btn brand" onclick="openIcProspectRadarV40()">Nouvelle recherche</button></div><div class="notice"><b>${items.length} résultat(s)</b> · Les demandes explicites sont distinguées des simples cibles commerciales compatibles.</div><div class="cards" style="margin-top:12px">${items.length?items.map(leadCard).join(''):'<div class="empty">Aucune opportunité correspondant à cette recherche pour le moment.</div>'}</div>`;
};
window.saveIcProspectV40=async function(i){
 if(!logged()||!pro360())return openIcPlans();const x=V.items[Number(i)];if(!x)return;
 const payload={user_id:S.session.user.id,prospect_key:String(x.key||('ic:'+Date.now())),lead_kind:x.lead_kind||'business',company:x.company||null,title:x.title||null,sector:x.sector||null,address:x.address||null,city:x.city||null,distance_km:x.distance_km??null,score:Number(x.score||0),status:'to_qualify',notes:x.proof_label||null,source_snapshot:x,updated_at:new Date().toISOString()};
 const {error}=await sb.from('sd_prospect_pipeline').upsert(payload,{onConflict:'user_id,prospect_key'});if(error)return say(error.message);say('Prospect ajouté au suivi commercial.');
};

// Route legacy visible "Radar Prospects" entry points to the secured V40 engine.
// Do not intercept the actual launch button: it must execute runIcProspectRadarV40().
document.addEventListener('click',ev=>{const el=ev.target?.closest?.('button,a');if(!el||el.id==='icV40Run')return;const t=(el.textContent||'').replace(/\s+/g,' ').trim();if(/Radar Prospects/i.test(t)&&!el.closest('.modalback')){ev.preventDefault();ev.stopImmediatePropagation();openIcProspectRadarV40()}},true);

// Keep the V40 entry point visible in the professional dashboard.
const basePro=typeof proAccount==='function'?proAccount:null;
if(basePro)window.proAccount=function(...args){const r=basePro.apply(this,args);setTimeout(()=>{if(typeof main==='undefined'||!main||document.getElementById('icV40RadarPanel'))return;const box=document.createElement('section');box.id='icV40RadarPanel';box.className='card';box.style.marginBottom='14px';box.innerHTML=`<div class="row between"><div><span class="pill">⭐ PRO 360</span><h2 style="margin:7px 0 3px">🎯 Radar Prospects</h2><p class="muted" style="margin:0">Besoins confirmés + cibles professionnelles compatibles, dans un seul moteur Issoire Connect.</p></div><button class="btn brand" onclick="openIcProspectRadarV40()">Ouvrir</button></div>`;main.prepend(box)},0);return r};

// Official radius set: 1 / 5 / 10 / 20 / 50 km everywhere.
for(const name of ['openIcProfileSettings','openIcNeedRequest']){const old=window[name];if(typeof old==='function')window[name]=function(...args){const r=old.apply(this,args);setTimeout(()=>normalizeSelect(name==='openIcProfileSettings'?'icpRadius':'icNeedRadius'),0);return r}}
const oldDirectory=window.renderDirectoryPage;if(typeof oldDirectory==='function')window.renderDirectoryPage=async function(...args){const r=await oldDirectory.apply(this,args);const s=document.getElementById('dirDistance');if(s){const cur=Number(s.value||0),best=cur===0?0:(RADII.includes(cur)?cur:(cur<=1?1:cur<=5?5:cur<=10?10:cur<=20?20:50));s.innerHTML=radiusOptions(best,true);s.value=String(best)}return r};

// Clean legacy commercial wording still produced by older compatibility modules.
const cleanLegacy=()=>document.querySelectorAll('body *').forEach(el=>{if(el.children.length)return;const t=el.textContent||'';if(/Connect Pro ou Pro\+|Pro\/Pro\+/.test(t))el.textContent=t.replace(/Connect Pro ou Pro\+/g,'Pro 360').replace(/Pro\/Pro\+/g,'Pro 360')});
new MutationObserver(()=>cleanLegacy()).observe(document.body,{subtree:true,childList:true});setTimeout(cleanLegacy,250);
})();


;/* ===== radar-prospects-mobile-fix-v40.js ===== */
(()=>{
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const IC_RADII=[1,5,10,20,50],RR={items:[],last:null};
const ee=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
const currentBusiness=()=>Array.isArray(S.myBusinesses)&&S.myBusinesses.length?S.myBusinesses[0]:null;
const hasPro360=()=>typeof window.icHasPro360==='function'?window.icHasPro360():S.profile?.role==='admin'||['pro','proplus'].includes(S.subscription?.plan||'');
const isMobile=()=>window.matchMedia('(max-width:699px)').matches;
const radiusOptions=value=>IC_RADII.map(x=>`<option value="${x}" ${Number(value)===x?'selected':''}>${x} km</option>`).join('');
function defaultRadius(pref,b){const pr=Number(pref?.radius_km),br=Number(b?.visibility_radius_km);if(IC_RADII.includes(pr))return pr;if(IC_RADII.includes(br))return br;return 20}
function radarForm({profession,city,postal,radius}){return `<div class="ic-radar-form"><div class="notice"><b>🔥 Besoin confirmé</b> = demande réellement publiée. <b>🔵 Cible compatible</b> = prospect pertinent à qualifier, sans besoin supposé comme certain.</div><div class="form" style="margin-top:12px"><label>Votre métier / activité</label><input id="icV40Profession" maxlength="160" value="${ee(profession)}" placeholder="Ex. chef cuisinier, plombier, photographe…"><div class="two"><div><label>Ville</label><input id="icV40City" value="${ee(city)}"></div><div><label>Code postal</label><input id="icV40Postal" value="${ee(postal)}"></div></div><label>Rayon</label><select id="icV40Radius">${radiusOptions(radius)}</select><button id="icV40Run" class="btn brand" onclick="runIcProspectRadarV40()">🎯 Lancer le Radar Prospects</button></div></div>`}
function leadCard(x,i){const need=x.proof_level==='confirmed_need',d=x.distance_km!=null?` · 📍 ${Number(x.distance_km).toFixed(1)} km`:'';const b=currentBusiness();const reply=need&&b&&String(x.key||'').startsWith('need:')&&typeof window.replyIcNeed==='function'?`<button class="btn brand" onclick="replyIcNeed('${ee(String(x.key).slice(5))}','${ee(b.id)}')">💬 Répondre</button>`:'';return `<article class="card" style="border-top:4px solid ${need?'#f47721':'#1677d2'}"><div class="row between"><span class="pill">${ee(x.proof_label||'Prospect')}</span><span class="pill">${Number(x.score||0)} %</span></div><h3>${ee(x.title||x.company||'Opportunité')}</h3><div class="muted">${ee(x.company||'')}${x.city?' · '+ee(x.city):''}${d}</div>${x.why_target?`<p>${ee(x.why_target)}</p>`:''}${x.why_now?`<div class="notice">${ee(x.why_now)}</div>`:''}<div class="actions" style="margin-top:10px">${reply}<button class="btn" onclick="saveIcProspectV40(${i})">👥 Ajouter aux prospects</button></div></article>`}
window.renderIcProspectRadarV40=function(data={}){if(typeof main==='undefined'||!main)return;RR.items=Array.isArray(data.items)?data.items:RR.items;const zone=data.zone||RR.last||{};main.innerHTML=`<div class="sectionhead"><div><span class="pill">⭐ PRO 360</span><h2 style="margin-top:8px">🎯 Radar Prospects</h2><p>${ee(data.profession||RR.last?.profession||'')} · ${ee(zone.city||'Issoire')} · ${Number(zone.radius_km||RR.last?.radius_km||20)} km</p></div><button class="btn brand" onclick="openIcProspectRadarV40()">Nouvelle recherche</button></div><button class="btn" onclick="go('account')" style="margin-bottom:12px">← Retour à mon espace Pro</button><div class="notice"><b>${RR.items.length} résultat(s)</b> · Les besoins réellement publiés sont distingués des simples cibles commerciales compatibles.</div><div class="cards" style="margin-top:12px">${RR.items.length?RR.items.map(leadCard).join(''):'<div class="empty">Aucune opportunité correspondant à cette recherche pour le moment.</div>'}</div>`;window.scrollTo({top:0,behavior:'smooth'})};
window.saveIcProspectV40=async function(i){if(!S.session||!hasPro360())return openIcProspectRadarV40();const x=RR.items[Number(i)];if(!x)return;const payload={user_id:S.session.user.id,prospect_key:String(x.key||('ic:'+Date.now())),lead_kind:x.lead_kind||'business',company:x.company||null,title:x.title||null,sector:x.sector||null,address:x.address||null,city:x.city||null,distance_km:x.distance_km??null,score:Number(x.score||0),status:'to_qualify',notes:x.proof_label||null,source_snapshot:x,updated_at:new Date().toISOString()};const {error}=await sb.from('sd_prospect_pipeline').upsert(payload,{onConflict:'user_id,prospect_key'});if(error)return say(error.message);say('Prospect ajouté au suivi commercial.')};
window.openIcProspectRadarV40=async function(){
 if(!S.session){if(typeof authModal==='function')return authModal('account');return say('Connectez-vous pour utiliser le Radar Prospects.');}
 if(!hasPro360()){if(typeof openIcPlans==='function')return openIcPlans();return say('Le Radar Prospects nécessite Pro 360.');}
 let pref=null;try{const {data}=await sb.from('ic_prospect_preferences').select('*').eq('user_id',S.session.user.id).maybeSingle();pref=data}catch{}
 const b=currentBusiness(),p=S.profile||{};
 const profession=pref?.profession||b?.category||'';
 const city=pref?.city||b?.city||p.city||'Issoire';
 const postal=pref?.postal_code||b?.postal_code||p.postal_code||'63500';
 const radius=defaultRadius(pref,b);
 const form=radarForm({profession,city,postal,radius});
 if(isMobile()){
   if(typeof closeModal==='function')closeModal();
   if(typeof main!=='undefined'&&main){main.innerHTML=`<div class="sectionhead"><div><span class="pill">⭐ PRO 360</span><h2 style="margin-top:8px">🎯 Radar Prospects</h2><p>Recherchez des opportunités locales sur un écran dédié.</p></div></div><button class="btn" onclick="go('account')" style="margin-bottom:12px">← Retour à mon espace Pro</button>${form}`;window.scrollTo({top:0,behavior:'smooth'});}
   return;
 }
 openModal(`<h2>🎯 Radar Prospects — Pro 360</h2><p>Trouvez des opportunités locales à partir des besoins publiés dans Issoire Connect et des entreprises compatibles de votre zone.</p>${form}`);
};
window.runIcProspectRadarV40=async function(){
 if(!S.session||!hasPro360())return openIcProspectRadarV40();
 const profession=document.getElementById('icV40Profession')?.value.trim()||'';
 const city=document.getElementById('icV40City')?.value.trim()||'Issoire';
 const postal_code=document.getElementById('icV40Postal')?.value.trim()||'';
 const radius_km=Number(document.getElementById('icV40Radius')?.value||currentBusiness()?.visibility_radius_km||20);
 if(profession.length<2)return say('Indiquez votre métier ou votre activité.');
 if(!IC_RADII.includes(radius_km))return say('Choisissez un rayon valide.');
 const btn=document.getElementById('icV40Run');if(btn){btn.disabled=true;btn.textContent='Recherche en cours…'}
 let geo=null;try{geo=JSON.parse(localStorage.getItem('ic_resident_geo')||'null')}catch{}
 const body={profession,city,postal_code,radius_km};if(geo){const lat=Number(geo.lat??geo.latitude),lon=Number(geo.lon??geo.lng??geo.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon)){body.latitude=lat;body.longitude=lon}}
 try{
   const timeout=new Promise(resolve=>setTimeout(()=>resolve({data:null,error:{message:'La recherche prend trop de temps. Réessayez dans quelques secondes.'}}),20000));
   const {data,error}=await Promise.race([sb.functions.invoke('ic-prospect-radar',{body}),timeout]);
   if(error){const msg=String(error.message||'Radar indisponible');if(/403|pro360/i.test(msg)){if(typeof closeModal==='function')closeModal();if(typeof openIcPlans==='function')return openIcPlans()}return say(msg)}
   if(data?.error==='pro360_required'){if(typeof closeModal==='function')closeModal();if(typeof openIcPlans==='function')return openIcPlans();return}
   RR.items=Array.isArray(data?.items)?data.items:[];RR.last={profession,city,postal_code,radius_km};
   if(typeof closeModal==='function')closeModal();
   window.renderIcProspectRadarV40(data||{});
 }catch(err){say('Radar indisponible : '+String(err?.message||err));}
 finally{if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='🎯 Lancer le Radar Prospects'}}
};
})();


;/* ===== mobile-pro-services-v40.js ===== */
(()=>{
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const RADII=[1,5,10,20,50];
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const owned=id=>(S.myBusinesses||[]).find(b=>b.id===id&&S.session&&b.owner_id===S.session.user.id);
const paid=b=>S.profile?.role==='admin'||['essential','pro','proplus'].includes(String(b?.plan||S.subscription?.plan||''));
const radiusOpts=v=>RADII.map(x=>`<option value="${x}" ${Number(v||20)===x?'selected':''}>${x} km</option>`).join('');
const audienceLabel=v=>v==='individuals'?'👤 Particuliers':v==='professionals'?'🏪 Professionnels':'👤🏪 Particuliers + professionnels';
const locationLabel=v=>v==='customer'?'🚗 Chez le client':v==='remote'?'💻 À distance':v==='both'?'📍 Sur place + chez le client':'🏪 Dans l’établissement';
const pricingLabel=p=>{if(p.requires_quote||p.pricing_unit==='quote'||p.price==null)return 'Sur devis';const n=Number(p.price).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2});return p.pricing_unit==='hour'?`${n} €/h`:p.pricing_unit==='person'?`${n} €/personne`:p.pricing_unit==='day'?`${n} €/jour`:`${n} €`;};
function publicArea(b){const r=Number(b.visibility_radius_km||20);return b.service_area_label||`Basé à ${b.city||'Issoire'} — intervient jusqu’à ${r} km`;}
function modeLabel(b){return b.business_mode==='mobile'?'🚗 Professionnel mobile':b.business_mode==='both'?'🏪🚗 Établissement + interventions':'🏪 Établissement';}

window.openIcBusinessModeV40=function(id){const b=owned(id);if(!b)return say('Accès refusé.');openModal(`<h2>📍 Mode d’activité</h2><p>Définissez comment vos clients peuvent faire appel à vous. Un professionnel mobile peut masquer son adresse personnelle.</p><div class="form"><label>Je travaille…</label><select id="icbmMode"><option value="establishment" ${b.business_mode==='establishment'?'selected':''}>Dans mon établissement</option><option value="mobile" ${b.business_mode==='mobile'?'selected':''}>Chez mes clients / professionnel mobile</option><option value="both" ${b.business_mode==='both'?'selected':''}>Dans mon établissement ET chez mes clients</option></select><label>Zone d’intervention / visibilité</label><select id="icbmRadius">${radiusOpts(b.visibility_radius_km||20)}</select><label>Texte public de zone</label><input id="icbmArea" maxlength="180" value="${e(b.service_area_label||publicArea(b))}" placeholder="Ex. Basé à Issoire — intervient jusqu’à 20 km"><label style="display:flex;gap:8px;align-items:center"><input id="icbmShowAddress" type="checkbox" ${b.show_public_address!==false?'checked':''}> Afficher mon adresse complète au public</label><div class="notice"><b>Conseil :</b> si votre adresse est votre domicile et que vous vous déplacez chez les clients, décochez cette case.</div><button class="btn brand" onclick="saveIcBusinessModeV40('${e(id)}')">💾 Enregistrer</button></div>`)};
window.saveIcBusinessModeV40=async function(id){const b=owned(id);if(!b)return;const mode=document.getElementById('icbmMode')?.value||'establishment',visibility_radius_km=Number(document.getElementById('icbmRadius')?.value||20),show_public_address=!!document.getElementById('icbmShowAddress')?.checked,service_area_label=document.getElementById('icbmArea')?.value.trim()||null;const {data,error}=await sb.from('ic_businesses').update({business_mode:mode,visibility_radius_km,show_public_address,service_area_label,updated_at:new Date().toISOString()}).eq('id',id).eq('owner_id',S.session.user.id).select('*').single();if(error)return say(error.message);Object.assign(b,data);const pub=(S.businesses||[]).find(x=>x.id===id);if(pub)Object.assign(pub,data);closeModal();say('Mode d’activité mis à jour.');if(typeof proAccount==='function')proAccount()};

window.openIcServiceV40=function(bid,id=''){const b=owned(bid);if(!b)return say('Accès refusé.');if(!paid(b)){if(typeof openIcPlans==='function')return openIcPlans();return say('Pro Local ou Pro 360 requis.')}const p=(S.products||[]).find(x=>x.id===id&&x.business_id===bid)||{};openModal(`<h2>${id?'✏️ Modifier':'➕ Ajouter'} une prestation</h2><p class="muted">Décrivez précisément ce que vous proposez aux particuliers et/ou aux professionnels.</p><div class="form"><label>Nom de la prestation</label><input id="icsName" maxlength="160" value="${e(p.name||'')}" placeholder="Ex. Chef cuisinier à domicile — soirée privée"><label>Description</label><textarea id="icsDesc" maxlength="3000" rows="5" placeholder="Ce qui est compris, type de prestation, conditions…">${e(p.description||'')}</textarea><div class="two"><div><label>Pour qui ?</label><select id="icsAudience"><option value="both" ${(!p.audience||p.audience==='both')?'selected':''}>Particuliers + professionnels</option><option value="individuals" ${p.audience==='individuals'?'selected':''}>Particuliers</option><option value="professionals" ${p.audience==='professionals'?'selected':''}>Professionnels</option></select></div><div><label>Où ?</label><select id="icsLocation"><option value="business" ${(!p.service_location||p.service_location==='business')?'selected':''}>Dans l’établissement</option><option value="customer" ${p.service_location==='customer'?'selected':''}>Chez le client</option><option value="both" ${p.service_location==='both'?'selected':''}>Sur place + chez le client</option><option value="remote" ${p.service_location==='remote'?'selected':''}>À distance</option></select></div></div><div class="two"><div><label>Type de tarif</label><select id="icsPricing" onchange="icServicePricingChanged()"><option value="fixed" ${(!p.pricing_unit||p.pricing_unit==='fixed')?'selected':''}>Forfait / prix fixe</option><option value="hour" ${p.pricing_unit==='hour'?'selected':''}>À l’heure</option><option value="person" ${p.pricing_unit==='person'?'selected':''}>Par personne</option><option value="day" ${p.pricing_unit==='day'?'selected':''}>À la journée</option><option value="quote" ${p.pricing_unit==='quote'?'selected':''}>Sur devis</option></select></div><div id="icsPriceWrap"><label>Prix à partir de (€)</label><input id="icsPrice" type="number" min="0" step="0.01" value="${p.price??''}"></div></div><label>Rayon d’intervention</label><select id="icsRadius"><option value="">Non applicable</option>${RADII.map(x=>`<option value="${x}" ${Number(p.intervention_radius_km)===x?'selected':''}>${x} km</option>`).join('')}</select><div class="two"><div><label>Durée indicative (minutes)</label><input id="icsDuration" type="number" min="1" value="${p.duration_minutes??''}" placeholder="Ex. 180"></div><div><label>Disponibilités</label><input id="icsAvailability" maxlength="250" value="${e(p.availability_text||'')}" placeholder="Ex. Vendredi et samedi soir"></div></div><div class="two"><div><label>Nombre min. de personnes</label><input id="icsMin" type="number" min="1" value="${p.min_people??''}"></div><div><label>Nombre max. de personnes</label><input id="icsMax" type="number" min="1" value="${p.max_people??''}"></div></div><label>Image URL — facultatif</label><input id="icsImage" type="url" value="${e(p.image_url||'')}" placeholder="https://..."><button class="btn brand" onclick="saveIcServiceV40('${e(bid)}','${e(id)}')">💾 ${id?'Enregistrer':'Publier la prestation'}</button></div>`);setTimeout(icServicePricingChanged,0)};
window.icServicePricingChanged=function(){const q=document.getElementById('icsPricing')?.value==='quote',w=document.getElementById('icsPriceWrap');if(w)w.style.display=q?'none':'block'};
window.saveIcServiceV40=async function(bid,id=''){const b=owned(bid);if(!b)return;const name=document.getElementById('icsName')?.value.trim()||'',description=document.getElementById('icsDesc')?.value.trim()||null;if(name.length<3)return say('Ajoutez un nom de prestation.');const pricing_unit=document.getElementById('icsPricing')?.value||'fixed',raw=document.getElementById('icsPrice')?.value,requires_quote=pricing_unit==='quote',price=requires_quote||raw===''?null:Number(raw);if(!requires_quote&&(!Number.isFinite(price)||price<0))return say('Indiquez un prix valide ou choisissez « Sur devis ».');const minRaw=document.getElementById('icsMin')?.value,maxRaw=document.getElementById('icsMax')?.value,durRaw=document.getElementById('icsDuration')?.value,radRaw=document.getElementById('icsRadius')?.value;const payload={business_id:bid,kind:'service',name,description,price,price_label:requires_quote?'Sur devis':null,image_url:document.getElementById('icsImage')?.value.trim()||null,is_active:true,audience:document.getElementById('icsAudience')?.value||'both',service_location:document.getElementById('icsLocation')?.value||'business',pricing_unit,requires_quote,availability_text:document.getElementById('icsAvailability')?.value.trim()||null,duration_minutes:durRaw?Number(durRaw):null,min_people:minRaw?Number(minRaw):null,max_people:maxRaw?Number(maxRaw):null,intervention_radius_km:radRaw?Number(radRaw):null};let q=id?sb.from('ic_products').update(payload).eq('id',id).eq('business_id',bid):sb.from('ic_products').insert(payload);const {data,error}=await q.select('*').single();if(error)return say(error.message);if(id){const old=(S.products||[]).find(x=>x.id===id);if(old)Object.assign(old,data)}else S.products=(S.products||[]).concat(data);closeModal();say(id?'Prestation mise à jour.':'Prestation publiée.');if(typeof proAccount==='function')proAccount()};
window.toggleIcServiceV40=async function(id,active){const p=(S.products||[]).find(x=>x.id===id),b=owned(p?.business_id);if(!p||!b)return;const {error}=await sb.from('ic_products').update({is_active:!!active}).eq('id',id).eq('business_id',b.id);if(error)return say(error.message);p.is_active=!!active;say(active?'Prestation activée.':'Prestation mise en pause.');proAccount()};

function serviceCard(p,owner=false){return `<article class="card"><div class="row between"><span class="pill">${e(audienceLabel(p.audience))}</span>${owner?`<span class="pill">${p.is_active!==false?'🟢 Active':'⚪ En pause'}</span>`:''}</div><h3>${e(p.name)}</h3><div class="muted">${e(locationLabel(p.service_location))}${p.intervention_radius_km?` · rayon ${Number(p.intervention_radius_km)} km`:''}</div><p>${e(p.description||'')}</p><strong style="font-size:20px">${e(pricingLabel(p))}</strong>${p.availability_text?`<div class="muted" style="margin-top:7px">🕒 ${e(p.availability_text)}</div>`:''}${p.min_people||p.max_people?`<div class="muted">👥 ${p.min_people?`min. ${Number(p.min_people)}`:''}${p.min_people&&p.max_people?' · ':''}${p.max_people?`max. ${Number(p.max_people)}`:''}</div>`:''}${owner?`<div class="actions" style="margin-top:10px"><button class="btn brand" onclick="openIcServiceV40('${e(p.business_id)}','${e(p.id)}')">✏️ Modifier</button><button class="btn" onclick="toggleIcServiceV40('${e(p.id)}',${p.is_active===false?'true':'false'})">${p.is_active===false?'▶ Activer':'⏸ Pause'}</button></div>`:''}</article>`}

// Hide a private street address in all legacy cards/details by substituting the public service area during rendering.
const oldCard=window.businessCard;if(typeof oldCard==='function')window.businessCard=function(b){const hide=b&&b.show_public_address===false&&b.address;const original=hide?b.address:null;if(hide)b.address=publicArea(b);try{return oldCard(b)}finally{if(hide)b.address=original}};
const oldView=window.viewBusiness;if(typeof oldView==='function')window.viewBusiness=function(id){const b=(S.businesses||[]).find(x=>x.id===id)||(S.myBusinesses||[]).find(x=>x.id===id),hide=b&&b.show_public_address===false&&b.address,original=hide?b.address:null;if(hide)b.address=publicArea(b);try{oldView(id)}finally{if(hide)b.address=original}if(!b||typeof modalBody==='undefined'||!modalBody)return;const list=(S.products||[]).filter(p=>p.business_id===id&&p.kind==='service'&&p.is_active!==false);modalBody.insertAdjacentHTML('beforeend',`<div class="notice" style="margin-top:12px"><b>${e(modeLabel(b))}</b><br>${e(publicArea(b))}${b.show_public_address===false?'<br><small>Adresse privée non affichée.</small>':''}</div>${list.length?`<h3 style="margin-top:16px">🛍️ Prestations</h3><div class="cards">${list.slice(0,12).map(p=>serviceCard(p,false)).join('')}</div>`:''}`)};

const oldPro=window.proAccount;if(typeof oldPro==='function')window.proAccount=function(...args){const r=oldPro.apply(this,args);setTimeout(()=>{if(typeof main==='undefined'||!main||document.getElementById('icMobileProV40'))return;const bs=S.myBusinesses||[];if(!bs.length)return;const sec=document.createElement('section');sec.id='icMobileProV40';sec.style.marginBottom='14px';sec.innerHTML=`<div class="sectionhead"><div><span class="pill">V40 · PROFIL PROFESSIONNEL</span><h2 style="margin-top:7px">🏪🚗 Établissement ou professionnel mobile</h2><p>Présentez votre zone d’intervention et vos prestations pour particuliers, professionnels ou les deux.</p></div></div>${bs.map(b=>{const ps=(S.products||[]).filter(p=>p.business_id===b.id&&p.kind==='service');return `<article class="card" style="margin-bottom:12px"><div class="row between"><div><span class="pill">${e(modeLabel(b))}</span><h3 style="margin:7px 0">${e(b.name)}</h3><div class="muted">${e(publicArea(b))}${b.show_public_address===false?' · 🔒 adresse privée masquée':''}</div></div><div class="actions"><button class="btn" onclick="openIcBusinessModeV40('${e(b.id)}')">📍 Mode & zone</button><button class="btn brand" onclick="openIcServiceV40('${e(b.id)}')">+ Prestation</button></div></div>${ps.length?`<div class="cards" style="margin-top:12px">${ps.map(p=>serviceCard(p,true)).join('')}</div>`:'<div class="empty" style="margin-top:10px">Aucune prestation détaillée. Ajoutez par exemple « Chef à domicile », « Renfort cuisine », « Dépannage », « Shooting photo »…</div>'}</article>`}).join('')}`;main.prepend(sec)},0);return r};
})();


;/* ===== legal-v40.js ===== */
(()=>{
if(typeof window==='undefined')return;
const legalBase=()=>new URL('../',location.href).href;
window.openIcLegal=function(file){const allowed=new Set(['mentions-legales.html','confidentialite.html','cgu.html','cgv-pro.html']);if(!allowed.has(file))return;window.open(new URL(file,legalBase()).href,'_blank','noopener,noreferrer')};
function legalPanel(){return `<section id="icLegalV40" class="card" style="margin-top:16px"><div class="row between"><div><span class="pill">⚖️ INFORMATIONS & CONFIDENTIALITÉ</span><h3 style="margin:7px 0 3px">Documents Issoire Connect</h3><div class="muted">Documents de pré-lancement. Les informations d’identification de l’éditeur restent à compléter avant les paiements réels.</div></div></div><div class="actions" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:7px"><button class="btn" onclick="openIcLegal('mentions-legales.html')">Mentions légales</button><button class="btn" onclick="openIcLegal('confidentialite.html')">Confidentialité</button><button class="btn" onclick="openIcLegal('cgu.html')">CGU</button><button class="btn" onclick="openIcLegal('cgv-pro.html')">CGV Pro</button></div></section>`}
function inject(){if(typeof main==='undefined'||!main||document.getElementById('icLegalV40'))return;main.insertAdjacentHTML('beforeend',legalPanel())}
for(const name of ['accountPage','proAccount','adminAccount']){const old=window[name];if(typeof old==='function')window[name]=function(...args){const r=old.apply(this,args);setTimeout(inject,0);return r}}
})();


;/* ===== functional-audit-fix-v41.js ===== */
(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const RADII=[1,5,10,20,50];
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
const byId=(arr,id)=>(arr||[]).find(x=>String(x.id)===String(id));
const businessForProduct=id=>{const p=byId(S.products,id);return p?byId(S.businesses,p.business_id):null};
const businessForOffer=id=>{const o=byId(S.offers,id);return o?byId(S.businesses,o.business_id):null};
const businessForJob=id=>{const j=byId(S.jobs,id);return j?byId(S.businesses,j.business_id):null};
const isOwn=owner=>!!(owner&&S.session?.user?.id===owner);
function friendly(err){
 const raw=String(err?.message||err||'Une erreur est survenue.'),m=raw.toLowerCase();
 if(m.includes('authentication')||m.includes('auth_required'))return 'Connectez-vous pour effectuer cette action.';
 if(m.includes('recipient not found'))return 'Ce professionnel n’a pas encore activé sa messagerie Issoire Connect.';
 if(m.includes('cannot message yourself'))return 'Vous ne pouvez pas vous envoyer un message à vous-même.';
 if(m.includes('invalid message')||m.includes('message_required'))return 'Écrivez un message avant de l’envoyer.';
 if(m.includes('offer unavailable'))return 'Cette offre n’est pas réservable en ligne actuellement.';
 if(m.includes('stock insuffisant'))return 'La quantité demandée n’est plus disponible.';
 if(m.includes('commandes et devis')||m.includes('réservations en ligne nécessitent'))return 'Ce professionnel n’a pas activé les commandes/réservations en ligne pour cette offre.';
 if(m.includes('status_transition_forbidden'))return 'Ce changement de statut n’est pas autorisé à cette étape.';
 if(m.includes('order_not_found'))return 'Commande introuvable.';
 if(m.includes('not_owner'))return 'Cette action est réservée au propriétaire de l’établissement.';
 if(m.includes('pro 360 requis'))return 'Cette fonction nécessite l’abonnement Pro 360.';
 if(m.includes('duplicate')||m.includes('23505'))return 'Cette action a déjà été enregistrée.';
 return raw;
}
function messageUnavailable(b){
 const phone=b?.phone?`<a class="btn" href="tel:${e(b.phone)}">📞 Appeler</a>`:'';
 const web=b?.website&&/^https?:\/\//i.test(b.website)?`<a class="btn brand" href="${e(b.website)}" target="_blank" rel="noopener">🌐 Site internet</a>`:'';
 openModal(`<h2>💬 Messagerie Issoire Connect</h2><div class="notice"><b>${e(b?.name||'Ce professionnel')}</b> n’a pas encore de compte destinataire relié à cette fiche.</div><p class="muted">La fiche reste consultable. Utilisez les coordonnées publiques disponibles ou, si vous représentez cet établissement, revendiquez la fiche.</p><div class="actions">${phone}${web}${!phone&&!web?'<button class="btn" onclick="closeModal()">Fermer</button>':''}</div>`);
}

// ---- Messagerie entreprise : jamais de bouton qui promet un envoi sans destinataire.
const oldMessageBusiness=window.messageBusiness;
window.messageBusiness=function(id){
 const b=byId(S.businesses,id);if(!b)return typeof say==='function'&&say('Établissement introuvable.');
 if(!b.owner_id)return messageUnavailable(b);
 if(isOwn(b.owner_id))return typeof say==='function'&&say('C’est votre propre établissement.');
 if(typeof oldMessageBusiness==='function')return oldMessageBusiness(id);
};
window.sendMessageBusiness=async function(id){
 if(!S.session)return typeof authModal==='function'?authModal('account'):null;
 const b=byId(S.businesses,id);if(!b?.owner_id)return messageUnavailable(b);
 if(isOwn(b.owner_id))return say('Vous ne pouvez pas vous envoyer un message à vous-même.');
 const body=document.getElementById('msgBody')?.value.trim()||'';if(!body)return say('Écrivez votre message.');
 const btn=document.querySelector('#modalBody button[onclick*="sendMessageBusiness"]');if(btn){btn.disabled=true;btn.textContent='Envoi…'}
 try{const {error}=await sb.rpc('ic_send_message',{p_body:body,p_business_id:id,p_classified_id:null});if(error)return say(friendly(error));closeModal();say('Message envoyé.');if(typeof loadPrivate==='function')await loadPrivate();}
 finally{if(btn){btn.disabled=false;btn.textContent='Envoyer'}}
};

// ---- Messagerie petites annonces : actif, non propriétaire, message non vide.
const oldMessageClassified=window.messageClassified;
window.messageClassified=function(id){
 const c=byId(S.classifieds,id);if(!c||c.is_active===false)return say('Cette annonce n’est plus disponible.');
 if(S.session&&c.user_id===S.session.user.id)return say('C’est votre propre annonce.');
 return typeof oldMessageClassified==='function'?oldMessageClassified(id):null;
};
window.sendMessageClassified=async function(id){
 if(!S.session)return typeof authModal==='function'?authModal('account'):null;
 const c=byId(S.classifieds,id);if(!c||c.is_active===false)return say('Cette annonce n’est plus disponible.');
 if(c.user_id===S.session.user.id)return say('C’est votre propre annonce.');
 const body=document.getElementById('msgBody')?.value.trim()||'';if(!body)return say('Écrivez votre message.');
 const {error}=await sb.rpc('ic_send_message',{p_body:body,p_business_id:null,p_classified_id:id});if(error)return say(friendly(error));closeModal();say('Message envoyé.');if(typeof loadPrivate==='function')await loadPrivate();
};
window.sendReply=async function(id){const body=document.getElementById('reply')?.value.trim()||'';if(!body)return say('Écrivez votre réponse.');const {error}=await sb.rpc('ic_reply_message',{p_message_id:id,p_body:body});if(error)return say(friendly(error));closeModal();say('Réponse envoyée.');if(typeof loadPrivate==='function')await loadPrivate();if(typeof render==='function')render();};

// ---- Offres : le bouton Réserver n’existe que si le commerçant a réellement activé la réservation.
const oldOfferCard=window.offerCard;
window.offerCard=function(o){
 let h=typeof oldOfferCard==='function'?oldOfferCard(o):'';
 const b=byId(S.businesses,o?.business_id),canReserve=o?.reservation_enabled===true&&o?.is_active!==false&&(!o.ends_at||new Date(o.ends_at)>new Date())&&(o.quantity==null||Number(o.quantity)>0);
 if(!canReserve){
   h=h.replace(/<button[^>]*onclick="reserveOffer\('([^']+)'\)"[^>]*>[^<]*<\/button>/g,b?`<button class="btn" onclick="viewBusiness('${e(b.id)}')">Voir le professionnel</button>`:'');
 }
 return h;
};
window.reserveOffer=function(id){
 if(!S.session){if(typeof requireAuth==='function')return requireAuth();return authModal('account')}
 const o=byId(S.offers,id);if(!o||o.is_active===false)return say('Cette offre n’est plus disponible.');
 if(o.reservation_enabled!==true)return say('Cette offre n’est pas réservable en ligne actuellement.');
 if(o.ends_at&&new Date(o.ends_at)<=new Date())return say('Cette offre est terminée.');
 if(o.quantity!=null&&Number(o.quantity)<=0)return say('Cette offre est épuisée.');
 openModal(`<h2>Réserver l’offre</h2><div class="form"><label>Quantité</label><input id="rq" type="number" min="1" max="${Math.max(1,Math.min(50,Number(o.quantity||50)))}" value="1"><label>Message (facultatif)</label><textarea id="rn" rows="3" placeholder="Précision pour le commerçant"></textarea><button class="btn green" onclick="confirmReserve('${e(id)}')">Confirmer la réservation</button></div>`);
};
window.confirmReserve=async function(id){const o=byId(S.offers,id),q=Number(document.getElementById('rq')?.value||1);if(!Number.isInteger(q)||q<1||q>50)return say('Quantité invalide.');if(o?.quantity!=null&&q>Number(o.quantity))return say('La quantité demandée n’est plus disponible.');const note=document.getElementById('rn')?.value.trim()||null;const {error}=await sb.rpc('ic_reserve_offer',{p_offer_id:id,p_quantity:q,p_note:note});if(error)return say(friendly(error));closeModal();say('Réservation envoyée au commerçant.');if(typeof refresh==='function')await refresh();};

// ---- Commandes / devis : message explicite si le professionnel n’a pas activé le service.
const oldOrderProduct=window.orderProduct;
window.orderProduct=function(id){
 const p=byId(S.products,id),b=p?byId(S.businesses,p.business_id):null;if(!p||p.is_active===false)return say('Ce produit ou service n’est plus disponible.');
 if(!b?.owner_id)return messageUnavailable(b);
 if(!['pro','proplus'].includes(String(b.plan||''))){
   openModal(`<h2>${p.price!=null?'Commander':'Demander un devis'}</h2><div class="notice">Les commandes/devis en ligne ne sont pas activés pour <b>${e(b.name)}</b>.</div><p>Vous pouvez néanmoins contacter le professionnel directement.</p><div class="actions"><button class="btn brand" onclick="closeModal();messageBusiness('${e(b.id)}')">💬 Contacter</button><button class="btn" onclick="closeModal()">Fermer</button></div>`);return;
 }
 return typeof oldOrderProduct==='function'?oldOrderProduct(id):null;
};
window.confirmProduct=async function(id){const p=byId(S.products,id);if(!p)return say('Produit ou service introuvable.');const q=Number(document.getElementById('pq')?.value||1);if(!Number.isInteger(q)||q<1||q>50)return say('Quantité invalide.');const note=document.getElementById('pn')?.value.trim()||null;const {error}=await sb.rpc('ic_order_product',{p_product_id:id,p_quantity:q,p_note:note});if(error)return say(friendly(error));closeModal();say(p.price==null?'Demande de devis envoyée.':'Commande envoyée.');if(typeof loadPrivate==='function')await loadPrivate();};

// ---- Emploi : pas de double candidature involontaire.
window.confirmJob=async function(id){if(!S.session)return authModal('account');const job=byId(S.jobs,id);if(!job||job.is_active===false)return say('Cette offre d’emploi n’est plus active.');const uid=S.session.user.id;const {data:existing,error:qerr}=await sb.from('ic_job_applications').select('id').eq('job_id',id).eq('applicant_id',uid).limit(1);if(qerr)return say(friendly(qerr));if(existing?.length){closeModal();return say('Vous avez déjà postulé à cette offre.');}const message=document.getElementById('jobMsg')?.value.trim()||null;const {error}=await sb.from('ic_job_applications').insert({job_id:id,applicant_id:uid,message});if(error)return say(friendly(error));closeModal();say('Candidature envoyée.');};

// ---- Statuts commandes : utiliser la RPC sécurisée déjà présente côté serveur.
window.setOrder=async function(id,status){
 const allowed=['accepted','ready','completed','cancelled'];if(!allowed.includes(status))return say('Statut invalide.');
 const {error}=await sb.rpc('ic_set_order_status',{p_order_id:id,p_status:status});if(error)return say(friendly(error));say('Statut de la commande mis à jour.');if(typeof loadPrivate==='function')await loadPrivate();if(typeof render==='function')render();
};

// ---- Saisie habitant : validations minimales avant d’écrire dans la base.
window.saveClassified=async function(){if(!S.session)return authModal('classifieds');const title=document.getElementById('ct')?.value.trim()||'',desc=document.getElementById('cd')?.value.trim()||'',raw=document.getElementById('cp')?.value||'',price=raw===''?null:Number(raw);if(title.length<3)return say('Ajoutez un titre à votre annonce.');if(raw!==''&&(!Number.isFinite(price)||price<0))return say('Prix invalide.');const {error}=await sb.from('ic_classifieds').insert({user_id:S.session.user.id,kind:document.getElementById('ck')?.value||'vente',title,description:desc||null,price,city:S.profile?.city||'Issoire'});if(error)return say(friendly(error));closeModal();say('Annonce publiée.');if(typeof refresh==='function')await refresh();};
window.saveResidentEvent=async function(){if(!S.session)return authModal('events');const title=document.getElementById('et')?.value.trim()||'',raw=document.getElementById('ed')?.value||'',place=document.getElementById('ep')?.value.trim()||'',d=new Date(raw);if(title.length<3)return say('Ajoutez un titre à l’événement.');if(!raw||Number.isNaN(d.getTime()))return say('Indiquez une date et une heure valides.');if(!place)return say('Indiquez le lieu.');const {error}=await sb.from('ic_events').insert({user_id:S.session.user.id,title,starts_at:d.toISOString(),place,description:document.getElementById('ee')?.value.trim()||null});if(error)return say(friendly(error));closeModal();say('Événement publié.');if(typeof refresh==='function')await refresh();};

// ---- Normaliser tous les sélecteurs de rayon encore produits par les anciens modules.
function normalizeRadiusSelect(sel){if(!sel)return;const vals=[...sel.options].map(o=>Number(o.value)).filter(Number.isFinite);if(!vals.some(v=>RADII.includes(v))&&!/radius|rayon|distance/i.test((sel.id||'')+' '+(sel.name||'')))return;const allowZero=vals.includes(0),cur=Number(sel.value||10);const best=RADII.includes(cur)?cur:(cur<=1?1:cur<=5?5:cur<=10?10:cur<=20?20:50);sel.innerHTML=(allowZero?'<option value="0">Toutes distances</option>':'')+RADII.map(v=>`<option value="${v}" ${v===best?'selected':''}>${v} km</option>`).join('');sel.value=String(allowZero&&cur===0?0:best);}
function syncActions(root=document){
 root.querySelectorAll?.('select').forEach(normalizeRadiusSelect);
 root.querySelectorAll?.('[onclick*="messageBusiness("]').forEach(btn=>{const m=(btn.getAttribute('onclick')||'').match(/messageBusiness\('([^']+)'\)/);const b=m?byId(S.businesses,m[1]):null;if(b&&!b.owner_id){btn.disabled=true;btn.textContent='💬 Messagerie après revendication';btn.title='Aucun compte professionnel n’est encore relié à cette fiche.'}else if(b&&isOwn(b.owner_id)){btn.disabled=true;btn.textContent='Votre établissement';}});
 root.querySelectorAll?.('[onclick*="reserveOffer("]').forEach(btn=>{const m=(btn.getAttribute('onclick')||'').match(/reserveOffer\('([^']+)'\)/),o=m?byId(S.offers,m[1]):null;if(o&&o.reservation_enabled!==true){const b=byId(S.businesses,o.business_id);if(b){btn.setAttribute('onclick',`viewBusiness('${b.id}')`);btn.textContent='Voir le professionnel';}else{btn.disabled=true;btn.textContent='Réservation indisponible';}}});
}
const obs=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)syncActions(n)});obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>syncActions(document),100);
window.icV41FunctionalAudit={version:'41.0',radii:RADII,friendlyError:friendly,syncActions};
})();


;/* ===== ui-consolidation-v42.js ===== */
(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const V42={feed:[],q:'',kind:'all',city:'',maxPrice:'',adminUsers:[],pipeline:[]};
const RADII=[1,5,10,20,50];
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const business=()=>Array.isArray(S.myBusinesses)&&S.myBusinesses.length?S.myBusinesses[0]:null;
const isAdmin=()=>!!(S.session&&S.profile?.role==='admin');
const has360=()=>typeof window.icHasPro360==='function'?window.icHasPro360():isAdmin()||['pro','proplus'].includes(String(business()?.plan||''));
const require360=feature=>{if(has360())return true;if(typeof window.icRequirePro360==='function')return window.icRequirePro360(feature);if(typeof openIcPlans==='function')openIcPlans();return false};
const fmtDate=v=>{try{return new Date(v).toLocaleDateString('fr-FR')}catch{return ''}};
const fmtDateTime=v=>{try{return new Date(v).toLocaleString('fr-FR')}catch{return ''}};
const euro=v=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('fr-FR',{style:'currency',currency:'EUR'}):''};

// ---------------------------------------------------------------------------
// 1) ACCUEIL : une seule entrée par service. Les anciens doublons
//    « Invendus/Bons plans » et « Entraide/Petites annonces » disparaissent.
// ---------------------------------------------------------------------------
window.menu=function(){
 const items=[
  ['🏢','Entreprises & commerces','businesses'],
  ['🔥','Bons plans','deals'],
  ['💼','Emplois','jobs'],
  ['📣','Annonces & besoins','classifieds'],
  ['📅','Événements','events'],
  ['📍','Autour de moi','nearby']
 ];
 return `<div class="gridmenu">${items.map(x=>`<button class="tile" onclick="go('${x[2]}')"><span>${x[0]}</span><b>${x[1]}</b></button>`).join('')}</div>`;
};

async function refreshPublicCounters(){
 try{
  const {data,error}=await sb.from('ic_public_counters').select('user_count,professional_count,business_count').eq('id',1).maybeSingle();
  if(error||!data)return;
  S.stats=S.stats||{};S.stats.users=Number(data.user_count||0);S.stats.pros=Number(data.professional_count||0);
  const boxes=document.querySelectorAll('.communitystats .counterbox strong');
  if(boxes[0])boxes[0].textContent=S.stats.users.toLocaleString('fr-FR');
  if(boxes[1])boxes[1].textContent=S.stats.pros.toLocaleString('fr-FR');
 }catch{}
}
const baseHome=window.homePage;
if(typeof baseHome==='function')window.homePage=function(...args){const r=baseHome.apply(this,args);setTimeout(refreshPublicCounters,0);return r};

// ---------------------------------------------------------------------------
// 2) ANNONCES : une seule page pour les petites annonces ET les besoins locaux.
//    Les besoins restent dans ic_needs : on ne duplique aucune ligne en base.
// ---------------------------------------------------------------------------
const KIND_LABEL={vente:'Vente',recherche:'Recherche',don:'Don',echange:'Échange',service:'Service',logement:'Logement',immobilier:'Logement',besoin:'Besoin local'};
const NEED_LABEL={travaux:'Maison & travaux',auto:'Auto & mobilité',alimentation:'Alimentation / restaurant',sante:'Santé',services:'Services',impression:'Impression / communication',evenement:'Événement',autre:'Autre'};
const urgency=v=>v==='urgent'?'🔴 Urgent':v==='aujourd_hui'?'🟠 Aujourd’hui':'🟢 Normal';
function safeImage(v){if(!v)return null;try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}}
async function loadUnifiedFeed(){
 const [ads,needs]=await Promise.all([
  sb.from('ic_classifieds').select('id,user_id,kind,title,description,price,price_label,city,image_url,is_active,created_at').eq('is_active',true).order('created_at',{ascending:false}).limit(500),
  sb.rpc('ic_public_needs',{p_limit:250})
 ]);
 if(ads.error)throw ads.error;if(needs.error)throw needs.error;
 const a=(ads.data||[]).map(x=>({...x,_source:'classified',is_mine:!!(S.session&&x.user_id===S.session.user.id)}));
 const n=(needs.data||[]).map(x=>({
  _source:'need',id:'need:'+x.id,need_id:x.id,kind:'besoin',title:'Besoin local',description:x.need_text,city:x.city,
  price:null,price_label:null,image_url:null,created_at:x.created_at,is_mine:!!x.is_mine,category:x.category,urgency:x.urgency,
  radius_km:x.radius_km,status:x.status
 }));
 V42.feed=[...a,...n].sort((x,y)=>new Date(y.created_at)-new Date(x.created_at));
 return V42.feed;
}
function filteredFeed(){
 const q=fold(V42.q.trim()),city=fold(V42.city.trim()),max=V42.maxPrice===''?null:Number(V42.maxPrice);
 return V42.feed.filter(x=>{
  if(V42.kind!=='all'&&x.kind!==V42.kind)return false;
  if(q&&!fold([x.title,x.description,x.city,KIND_LABEL[x.kind]||x.kind,NEED_LABEL[x.category]||x.category].join(' ')).includes(q))return false;
  if(city&&!fold(x.city).includes(city))return false;
  if(max!=null&&Number.isFinite(max)&&x.price!=null&&Number(x.price)>max)return false;
  return true;
 });
}
function classifiedCard(a){
 const img=safeImage(a.image_url),price=a.price_label?e(a.price_label):(a.price!=null?euro(a.price):''),own=a.is_mine;
 return `<article class="card ic-public-ad"><div class="row between"><div><span class="pill">${e(KIND_LABEL[a.kind]||a.kind||'Annonce')}</span><h3 style="margin-top:7px">${e(a.title)}</h3></div>${price?`<strong>${e(price)}</strong>`:''}</div>${img?`<img src="${e(img)}" alt="" loading="lazy" style="width:100%;height:210px;object-fit:cover;border-radius:14px;margin:8px 0" onerror="this.remove()">`:''}<p>${e(a.description||'')}</p><div class="muted">📍 ${e(a.city||'Issoire')} · ${fmtDate(a.created_at)}</div><div class="actions" style="margin-top:10px">${own?'<button class="btn" onclick="go(\'account\')">✏️ Gérer mon annonce</button>':`<button class="btn brand" onclick="openV42ClassifiedContact('${e(a.id)}')">💬 Contacter</button>`}</div></article>`;
}
function needCard(n){
 const b=business(),canReply=!n.is_mine&&b&&has360()&&typeof window.replyIcNeed==='function';
 return `<article class="card ic-public-need" style="border-top:4px solid #f47721"><div class="row between"><div><span class="pill">🙋 BESOIN LOCAL</span><h3 style="margin:7px 0 3px">${e(NEED_LABEL[n.category]||'Besoin local')}</h3></div><span class="pill">${e(urgency(n.urgency))}</span></div><p>${e(n.description||'')}</p><div class="muted">📍 ${e(n.city||'Issoire')} · rayon ${Number(n.radius_km||10)} km · ${fmtDate(n.created_at)}</div><div class="actions" style="margin-top:10px">${n.is_mine?'<button class="btn brand" onclick="openIcMyNeeds()">✏️ Gérer mon besoin</button>':canReply?`<button class="btn brand" onclick="replyIcNeed('${e(n.need_id)}','${e(b.id)}')">💬 Répondre au besoin</button>`:'<span class="muted">Les professionnels Pro 360 compatibles peuvent répondre via Issoire Connect.</span>'}</div></article>`;
}
function unifiedControls(){
 return `<div class="card" style="margin-bottom:12px"><div class="two"><div><label>Recherche</label><input id="v42FeedQ" value="${e(V42.q)}" placeholder="vélo, plombier, meuble, service…"></div><div><label>Type</label><select id="v42FeedKind"><option value="all">Tout afficher</option>${Object.entries(KIND_LABEL).filter(([k])=>k!=='immobilier').map(([v,l])=>`<option value="${v}" ${V42.kind===v?'selected':''}>${e(l)}</option>`).join('')}</select></div></div><div class="two" style="margin-top:8px"><div><label>Ville / secteur</label><input id="v42FeedCity" value="${e(V42.city)}" placeholder="Issoire"></div><div><label>Prix maximum (€)</label><input id="v42FeedMax" type="number" min="0" step="1" value="${e(V42.maxPrice)}" placeholder="Sans limite"></div></div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="applyV42FeedFilters()">🔎 Filtrer</button><button class="btn" onclick="resetV42FeedFilters()">↺ Réinitialiser</button><button class="btn" onclick="openResidentClassifiedEntry()">➕ Déposer une annonce</button><button class="btn primary" onclick="openIcNeedRequest()">🙋 Publier un besoin</button>${S.session?'<button class="btn" onclick="openIcMyNeeds()">Mes besoins</button>':''}</div></div>`;
}
window.renderPublicClassifieds=async function(){
 if(typeof main==='undefined'||!main)return;
 main.innerHTML='<div class="sectionhead"><div><h2>📣 Annonces & besoins locaux</h2><p>Chargement…</p></div></div><div class="empty">Chargement…</div>';
 try{await loadUnifiedFeed()}catch(err){main.innerHTML=`<div class="notice"><b>Impossible de charger les annonces et besoins.</b><br>${e(err?.message||err)}</div>`;return}
 const rows=filteredFeed();
 main.innerHTML=`<div class="sectionhead"><div><h2>📣 Annonces & besoins locaux</h2><p>${rows.length} publication(s) visible(s) : vente, don, recherche, services et besoins des habitants.</p></div><div class="actions"><button class="btn brand" onclick="openResidentClassifiedEntry()">➕ Annonce</button><button class="btn primary" onclick="openIcNeedRequest()">🙋 Besoin</button></div></div><div class="notice"><b>Un seul endroit pour les publications locales.</b><br>Un besoin publié dans « J’ai besoin de… » apparaît ici automatiquement, sans créer de doublon dans la base.</div>${unifiedControls()}${rows.length?`<div class="cards">${rows.slice(0,160).map(x=>x._source==='need'?needCard(x):classifiedCard(x)).join('')}</div>${rows.length>160?'<div class="notice">Affichage limité aux 160 premières publications. Utilisez les filtres pour affiner.</div>':''}`:'<div class="empty">Aucune publication ne correspond aux filtres.</div>'}`;
};
window.applyV42FeedFilters=function(){V42.q=document.getElementById('v42FeedQ')?.value||'';V42.kind=document.getElementById('v42FeedKind')?.value||'all';V42.city=document.getElementById('v42FeedCity')?.value||'';V42.maxPrice=document.getElementById('v42FeedMax')?.value||'';renderPublicClassifieds()};
window.resetV42FeedFilters=function(){V42.q='';V42.kind='all';V42.city='';V42.maxPrice='';renderPublicClassifieds()};
window.openV42ClassifiedContact=function(id){const a=V42.feed.find(x=>x._source==='classified'&&x.id===id);if(!a)return say('Annonce introuvable.');if(!S.session)return authModal('account');if(a.is_mine)return go('account');openModal(`<h2>💬 Contacter l’annonceur</h2><p><b>${e(a.title)}</b></p><div class="notice">Votre message passe par Issoire Connect. Aucune adresse personnelle n’est affichée.</div><label>Message</label><textarea id="v42ClassifiedMessage" rows="5" maxlength="2000" placeholder="Bonjour, votre annonce est-elle toujours disponible ?"></textarea><button class="btn brand" onclick="sendV42ClassifiedContact('${e(id)}')">Envoyer le message</button>`)};
window.sendV42ClassifiedContact=async function(id){if(!S.session)return authModal('account');const body=document.getElementById('v42ClassifiedMessage')?.value.trim();if(!body)return say('Écrivez un message avant l’envoi.');const {error}=await sb.rpc('ic_send_message',{p_body:body,p_business_id:null,p_classified_id:id});if(error)return say(error.message);closeModal();say('Message envoyé à l’annonceur.')};

// ---------------------------------------------------------------------------
// 3) ADMIN : l’onglet Utilisateurs affiche enfin les comptes Auth réels,
//    donc email + nom + rôle + dates. Aucun mot de passe n’est lu ni affiché.
// ---------------------------------------------------------------------------
const baseAdminLoadTab=window.adminLoadTab;
window.adminLoadTab=async function(tab,q='',keepShell=false){
 if(tab!=='profiles'||typeof baseAdminLoadTab!=='function')return typeof baseAdminLoadTab==='function'?baseAdminLoadTab(tab,q,keepShell):null;
 await baseAdminLoadTab(tab,'',keepShell);
 return renderV42AdminUsers(q);
};
async function renderV42AdminUsers(q=''){
 if(!isAdmin())return say('Accès administrateur requis.');
 const host=document.getElementById('adminList');if(!host)return;
 host.innerHTML='<div class="empty">Chargement des comptes réels…</div>';
 const input=document.getElementById('adminSearch');if(input){input.placeholder='Rechercher par email, nom ou ville';input.value=q||''}
 const {data,error}=await sb.rpc('ic_admin_user_directory',{p_search:q||null,p_limit:150});
 if(error){host.innerHTML=`<div class="notice">${e(error.message)}</div>`;return}
 V42.adminUsers=data||[];
 host.innerHTML=`<div class="sectionhead"><div><h2>👤 Utilisateurs inscrits</h2><p>${V42.adminUsers.length} compte(s) affiché(s). Les comptes sont lus depuis l’authentification réelle, pas seulement depuis le nom du profil.</p></div></div>${V42.adminUsers.length?`<div class="cards">${V42.adminUsers.map(u=>`<article class="card"><div class="row between"><div><span class="pill">${e(u.role||'resident')}</span><h3 style="margin:7px 0 2px">${e(u.display_name||u.email||'Utilisateur')}</h3></div>${S.session?.user?.id===u.id?'<span class="pill">TON COMPTE</span>':''}</div><div class="muted">✉️ ${e(u.email||'Email indisponible')}<br>📍 ${e(u.city||'Issoire')} ${e(u.postal_code||'')} · rayon ${Number(u.radius_km||10)} km<br>🗓 Inscrit le ${fmtDateTime(u.created_at)}${u.last_sign_in_at?`<br>Dernière connexion : ${fmtDateTime(u.last_sign_in_at)}`:''}</div><div class="actions"><button class="btn brand" onclick="openV42AdminUser('${e(u.id)}')">✏️ Modifier le profil</button></div></article>`).join('')}</div>`:'<div class="empty">Aucun compte ne correspond à la recherche.</div>'}`;
}
window.openV42AdminUser=function(id){if(!isAdmin())return;const u=V42.adminUsers.find(x=>x.id===id);if(!u)return say('Utilisateur introuvable.');const self=S.session?.user?.id===u.id;openModal(`<h2>👤 Modifier le profil utilisateur</h2><div class="notice"><b>${e(u.email||'')}</b><br>L’email de connexion est affiché en lecture seule. Aucun mot de passe n’est accessible ici.</div><div class="form"><label>Nom affiché</label><input id="v42auName" value="${e(u.display_name||'')}"><label>Rôle</label><select id="v42auRole" ${self?'disabled':''}><option value="resident" ${u.role==='resident'?'selected':''}>Habitant</option><option value="pro" ${u.role==='pro'?'selected':''}>Professionnel</option><option value="admin" ${u.role==='admin'?'selected':''}>Administrateur</option></select>${self?'<small class="muted">Ton propre rôle administrateur est verrouillé ici.</small>':''}<div class="two"><div><label>Ville</label><input id="v42auCity" value="${e(u.city||'Issoire')}"></div><div><label>Code postal</label><input id="v42auPostal" value="${e(u.postal_code||'63500')}"></div></div><label>Rayon</label><select id="v42auRadius">${RADII.map(r=>`<option value="${r}" ${Number(u.radius_km||10)===r?'selected':''}>${r} km</option>`).join('')}</select><button class="btn brand" onclick="saveV42AdminUser('${e(id)}')">💾 Enregistrer</button></div>`)};
window.saveV42AdminUser=async function(id){if(!isAdmin())return;const u=V42.adminUsers.find(x=>x.id===id);if(!u)return;const payload={display_name:document.getElementById('v42auName')?.value.trim()||null,city:document.getElementById('v42auCity')?.value.trim()||'Issoire',postal_code:document.getElementById('v42auPostal')?.value.trim()||'63500',radius_km:Number(document.getElementById('v42auRadius')?.value||10),updated_at:new Date().toISOString()};if(S.session?.user?.id!==id)payload.role=document.getElementById('v42auRole')?.value||'resident';const {error}=await sb.from('ic_profiles').update(payload).eq('id',id);if(error)return say(error.message);closeModal();say('Profil utilisateur mis à jour.');const q=document.getElementById('adminSearch')?.value||'';await renderV42AdminUsers(q)};

// ---------------------------------------------------------------------------
// 4) ESPACE PRO : un tableau de bord canonique, sans empilement de panneaux.
//    Chaque bouton ouvre une fonction réelle et unique.
// ---------------------------------------------------------------------------
const STATUS={to_qualify:'À qualifier',contacted:'Contacté',meeting:'Rendez-vous',proposal:'Proposition',won:'Gagné',lost:'Perdu'};
function proTool(icon,title,desc,onclick,locked=false){return `<article class="card"><div class="row"><div class="avatar">${icon}</div><div><h3>${e(title)}</h3><div class="muted">${e(desc)}</div></div></div><div class="actions"><button class="btn ${locked?'':'brand'}" onclick="${onclick}">${locked?'🔒 Pro 360':'Ouvrir'}</button></div></article>`}
window.proAccount=function(){
 if(!S.session)return authModal('account');
 const b=business();
 if(!b){main.innerHTML=`<div class="sectionhead"><div><span class="pill">🏪 ESPACE PRO</span><h2>Créer ou retrouver mon établissement</h2><p>Votre compte habitant reste le même. L’espace Pro s’ajoute dessus.</p></div><button class="btn" onclick="go('home')">Accueil habitant</button></div><div class="cards"><article class="card"><h3>🔎 Mon entreprise existe déjà</h3><p>Recherchez-la dans l’annuaire puis revendiquez sa fiche.</p><button class="btn brand" onclick="go('businesses')">Rechercher mon entreprise</button></article><article class="card"><h3>➕ Créer une nouvelle fiche</h3><p>Pour un nouvel établissement ou une activité mobile.</p><button class="btn brand" onclick="openIcCompanyProfile()">Créer ma fiche</button></article></div><div class="sectionhead"><div><h2>Abonnements Pro</h2></div></div>${typeof pricingHtml==='function'?pricingHtml(true,'free'):''}`;return;
 }
 const full=has360(),plan=full?'Pro 360':String(b.plan||'')==='essential'?'Pro Local':'Professionnel';
 const tools=[
  ['🎯','Radar Prospects','Trouver les besoins confirmés et les cibles compatibles',`openIcProspectRadarV40()`,!full],
  ['👥','Mes prospects','Consulter les prospects enregistrés par le Radar',`openV42Prospects()`,!full],
  ['📌','Suivi commercial / pipeline','Faire avancer chaque prospect jusqu’à gagné ou perdu',`openV42Pipeline()`,!full],
  ['📡','Opportunités Pro','Répondre aux besoins réellement publiés par les habitants',`openIcLocalNeeds('${e(b.id)}')`,!full],
  ['◎','Ma clientèle cible','Définir métier, ville et rayon du Radar Prospects',`openV42Targeting()`,!full],
  ['🛍️','Mes produits/services','Publier et consulter vos prestations et produits',`openV42Products()` ,false],
  ['🎁','Mes avantages','Créer les Avantages IC réservés aux membres',`openV42Benefits()`,false],
  ['💼','Recruter','Publier et consulter vos offres d’emploi',`openV42Recruiting()`,false],
  ['📣','Mes campagnes','Créer et suivre vos campagnes locales',`openV42Campaigns()`,!full],
  ['🏪','Mon établissement','Modifier la fiche, la zone, les horaires et les coordonnées',`openIcCompanyProfile('${e(b.id)}')`,false]
 ];
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">TABLEAU DE BORD PRO</span><h2 style="margin-top:8px">${e(b.name)}</h2><p>${e(plan)} · ${e(b.city||'Issoire')} · votre compte conserve aussi tous les services habitants.</p></div><div class="actions"><button class="btn" onclick="go('home')">🏠 Services habitants</button><button class="btn" onclick="openIcPlans()">💳 Abonnement</button><button class="btn" onclick="logout()">Déconnexion</button></div></div><div class="notice"><b>${full?'⭐ Pro 360 — tout inclus':'🏪 Pro Local — être trouvé'}</b><br>${full?'Radar Prospects, CRM, pipeline, opportunités et campagnes sont actifs.':'Les outils de prospection marqués Pro 360 nécessitent l’offre 19,99 €/mois.'}</div><div class="sectionhead"><div><h2>Outils professionnels</h2><p>Une seule entrée par fonction, dans l’ordre du parcours commercial.</p></div></div><div class="cards">${tools.map(t=>proTool(...t)).join('')}</div>`;
};

window.openV42Prospects=async function(){if(!require360('Mes prospects'))return;await loadV42Pipeline();renderV42Pipeline(false)};
window.openV42Pipeline=async function(){if(!require360('Suivi commercial / pipeline'))return;await loadV42Pipeline();renderV42Pipeline(true)};
async function loadV42Pipeline(){const {data,error}=await sb.from('sd_prospect_pipeline').select('*').eq('user_id',S.session.user.id).order('updated_at',{ascending:false}).limit(250);if(error){say(error.message);V42.pipeline=[];return}V42.pipeline=data||[]}
function renderV42Pipeline(showStages){
 const rows=V42.pipeline;
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">⭐ PRO 360</span><h2>${showStages?'📌 Suivi commercial / pipeline':'👥 Mes prospects'}</h2><p>${rows.length} prospect(s) enregistré(s).</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="openIcProspectRadarV40()">🎯 Radar Prospects</button></div></div>${rows.length?`<div class="cards">${rows.map(r=>`<article class="card"><div class="row between"><span class="pill">${e(STATUS[r.status]||r.status||'À qualifier')}</span><span class="pill">${Number(r.score||0)} %</span></div><h3>${e(r.company||r.title||'Prospect')}</h3><div class="muted">${e(r.title||'')}${r.city?' · '+e(r.city):''}${r.distance_km!=null?' · '+Number(r.distance_km).toFixed(1)+' km':''}</div>${r.notes?`<p>${e(r.notes)}</p>`:''}<div class="actions">${showStages?`<select id="v42status_${e(r.id)}" onchange="setV42ProspectStatus('${e(r.id)}',this.value)">${Object.entries(STATUS).map(([v,l])=>`<option value="${v}" ${r.status===v?'selected':''}>${e(l)}</option>`).join('')}</select>`:''}<button class="btn" onclick="editV42Prospect('${e(r.id)}')">📝 Notes / contact</button></div></article>`).join('')}</div>`:'<div class="empty">Aucun prospect enregistré. Lancez le Radar Prospects puis utilisez « Ajouter aux prospects ».</div>'}`;
}
window.setV42ProspectStatus=async function(id,status){if(!require360('Pipeline'))return;if(!STATUS[status])return say('Statut invalide.');const {error}=await sb.from('sd_prospect_pipeline').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);const r=V42.pipeline.find(x=>x.id===id);if(r)r.status=status;say('Étape commerciale mise à jour.')};
window.editV42Prospect=function(id){const r=V42.pipeline.find(x=>x.id===id);if(!r)return;openModal(`<h2>👥 ${e(r.company||r.title||'Prospect')}</h2><div class="form"><label>Contact</label><input id="v42pName" value="${e(r.contact_name||'')}" placeholder="Nom du contact"><label>Email</label><input id="v42pEmail" type="email" value="${e(r.contact_email||'')}"><label>Téléphone</label><input id="v42pPhone" value="${e(r.contact_phone||'')}"><label>Notes</label><textarea id="v42pNotes" rows="5">${e(r.notes||'')}</textarea><button class="btn brand" onclick="saveV42Prospect('${e(id)}')">💾 Enregistrer</button></div>`)};
window.saveV42Prospect=async function(id){const payload={contact_name:document.getElementById('v42pName')?.value.trim()||null,contact_email:document.getElementById('v42pEmail')?.value.trim()||null,contact_phone:document.getElementById('v42pPhone')?.value.trim()||null,notes:document.getElementById('v42pNotes')?.value.trim()||null,updated_at:new Date().toISOString()};const {error}=await sb.from('sd_prospect_pipeline').update(payload).eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);Object.assign(V42.pipeline.find(x=>x.id===id)||{},payload);closeModal();say('Prospect mis à jour.')};

window.openV42Targeting=async function(){if(!require360('Ma clientèle cible'))return;const b=business(),{data}=await sb.from('ic_prospect_preferences').select('*').eq('user_id',S.session.user.id).maybeSingle();const p=data||{};openModal(`<h2>◎ Ma clientèle cible</h2><p class="muted">Ces réglages deviennent les valeurs par défaut du Radar Prospects.</p><div class="form"><label>Métier / activité recherchée</label><input id="v42targetProfession" value="${e(p.profession||b?.category||'')}"><div class="two"><div><label>Ville</label><input id="v42targetCity" value="${e(p.city||b?.city||S.profile?.city||'Issoire')}"></div><div><label>Code postal</label><input id="v42targetPostal" value="${e(p.postal_code||b?.postal_code||S.profile?.postal_code||'63500')}"></div></div><label>Rayon</label><select id="v42targetRadius">${RADII.map(r=>`<option value="${r}" ${Number(p.radius_km||b?.visibility_radius_km||20)===r?'selected':''}>${r} km</option>`).join('')}</select><button class="btn brand" onclick="saveV42Targeting()">💾 Enregistrer ma cible</button></div>`)};
window.saveV42Targeting=async function(){const payload={user_id:S.session.user.id,profession:document.getElementById('v42targetProfession')?.value.trim()||null,city:document.getElementById('v42targetCity')?.value.trim()||'Issoire',postal_code:document.getElementById('v42targetPostal')?.value.trim()||null,radius_km:Number(document.getElementById('v42targetRadius')?.value||20),updated_at:new Date().toISOString()};if(!RADII.includes(payload.radius_km))return say('Rayon invalide.');const {error}=await sb.from('ic_prospect_preferences').upsert(payload,{onConflict:'user_id'});if(error)return say(error.message);closeModal();say('Clientèle cible enregistrée.')};

window.openV42Products=function(){const b=business();if(!b)return;const rows=(S.products||[]).filter(x=>x.business_id===b.id);main.innerHTML=`<div class="sectionhead"><div><h2>🛍️ Mes produits/services</h2><p>${rows.length} élément(s) publié(s).</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="newProduct('${e(b.id)}')">➕ Produit/service</button><button class="btn" onclick="openIcServiceV40('${e(b.id)}')">➕ Prestation détaillée</button></div></div>${rows.length?`<div class="cards">${rows.map(p=>`<article class="card"><div class="row between"><span class="pill">${e(p.kind||'service')}</span><span class="pill">${p.is_active!==false?'🟢 Actif':'⚪ Pause'}</span></div><h3>${e(p.name)}</h3><p>${e(p.description||'')}</p><strong>${p.price!=null?euro(p.price):e(p.price_label||'Sur devis')}</strong>${p.kind==='service'?`<div class="actions"><button class="btn brand" onclick="openIcServiceV40('${e(b.id)}','${e(p.id)}')">✏️ Modifier</button></div>`:''}</article>`).join('')}</div>`:'<div class="empty">Aucun produit ou service publié.</div>'}`};
window.openV42Benefits=function(){const b=business();if(!b)return;const rows=(S.offers||[]).filter(o=>o.business_id===b.id&&o.member_only===true);main.innerHTML=`<div class="sectionhead"><div><h2>🎁 Mes avantages</h2><p>${rows.length} Avantage(s) IC créé(s).</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="openIcMemberBenefit('${e(b.id)}')">➕ Créer un avantage</button></div></div>${rows.length?`<div class="cards">${rows.map(o=>`<article class="card"><span class="pill">${o.is_active!==false?'🟢 Actif':'⚪ Inactif'}</span><h3>${e(o.title)}</h3><p>${e(o.description||'')}</p><div class="muted">${e(o.price_label||o.benefit_text||'Avantage membre')}</div></article>`).join('')}</div>`:'<div class="empty">Aucun avantage créé.</div>'}`};
window.openV42Recruiting=function(){const b=business();if(!b)return;const rows=(S.jobs||[]).filter(j=>j.business_id===b.id);main.innerHTML=`<div class="sectionhead"><div><h2>💼 Recruter</h2><p>${rows.length} offre(s) d’emploi publiée(s).</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="newJob('${e(b.id)}')">➕ Publier une offre</button></div></div>${rows.length?`<div class="cards">${rows.map(j=>`<article class="card"><div class="row between"><span class="pill">${e(j.contract_type||'Emploi')}</span><span class="pill">${j.is_active!==false?'🟢 Active':'⚪ Inactive'}</span></div><h3>${e(j.title)}</h3><p>${e(j.description||'')}</p><div class="muted">📍 ${e(j.location||b.city||'Issoire')}</div></article>`).join('')}</div>`:'<div class="empty">Aucune offre d’emploi publiée.</div>'}`};
window.openV42Campaigns=function(){if(!require360('Mes campagnes'))return;const b=business();if(!b)return;main.innerHTML=`<div class="sectionhead"><div><span class="pill">⭐ PRO 360</span><h2>📣 Mes campagnes</h2><p>Créez et mesurez vos campagnes locales.</p></div><div class="actions"><button class="btn" onclick="go('account')">← Tableau de bord Pro</button><button class="btn brand" onclick="newAd('${e(b.id)}')">➕ Créer une campagne</button><button class="btn" onclick="openIcAdStats('${e(b.id)}')">📊 Statistiques</button></div></div><div class="notice">Les campagnes sont réservées à Pro 360. Les statistiques d’impressions et de clics sont accessibles depuis le bouton ci-dessus.</div>`};

// ---------------------------------------------------------------------------
// 5) Nettoyage ciblé des panneaux hérités qui répètent une fonction désormais
//    présente dans le tableau de bord ou dans Annonces & besoins.
// ---------------------------------------------------------------------------
const LEGACY_IDS=['icNeedHome','icV40RadarPanel','icMemberBenefitsPanel','icAdTools','icMobileProV40','icPlanPanel','icPlanUsage','icNeedProPanel','icAdminPlansProfile'];
function cleanLegacyPanels(root=document){for(const id of LEGACY_IDS)root.querySelector?.('#'+id)?.remove()}
const observer=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)cleanLegacyPanels(n);cleanLegacyPanels(document)});
observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>cleanLegacyPanels(document),0);

// Rebrancher explicitement la route Annonces sur le rendu unifié si un ancien
// wrapper de go l’a déjà créée avant ce correctif.
const baseGo=window.go;
if(typeof baseGo==='function')window.go=function(page,...args){const r=baseGo.call(this,page,...args);if(page==='classifieds')setTimeout(()=>window.renderPublicClassifieds(),80);if(page==='home')setTimeout(refreshPublicCounters,80);return r};

window.icV42={version:'42.0',loadUnifiedFeed,refreshPublicCounters,renderAdminUsers:renderV42AdminUsers,cleanLegacyPanels};
})();


;/* ===== agenda-v43.js ===== */
(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const A={rows:[],view:'upcoming'};
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const logged=()=>!!S.session;
const localInput=v=>{if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return'';const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
const fmtDate=v=>new Date(v).toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
const fmtTime=v=>new Date(v).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
const isPast=r=>new Date(r.ends_at||r.starts_at).getTime()<Date.now();

async function loadAgenda(){
 if(!logged()){A.rows=[];return[]}
 const {data,error}=await sb.from('ic_personal_agenda').select('*').eq('user_id',S.session.user.id).order('starts_at',{ascending:true}).limit(500);
 if(error)throw error;A.rows=data||[];return A.rows;
}
function appointmentCard(r){
 return `<article class="card" data-agenda-id="${e(r.id)}"><div class="row between"><div><span class="pill">${isPast(r)?'⚪ PASSÉ':'🟢 À VENIR'}</span><h3 style="margin:7px 0 3px">${e(r.title)}</h3></div><div style="text-align:right"><strong>${e(fmtTime(r.starts_at))}</strong><div class="muted">${e(fmtDate(r.starts_at))}</div></div></div>${r.ends_at?`<div class="muted">Jusqu’à ${e(fmtTime(r.ends_at))}</div>`:''}${r.place?`<p>📍 ${e(r.place)}</p>`:''}${r.notes?`<p>${e(r.notes)}</p>`:''}${r.source_event_id?'<span class="pill">📅 Événement Issoire Connect</span>':''}<div class="actions"><button class="btn brand" onclick="openIcAgendaForm('${e(r.id)}')">✏️ Modifier</button><button class="btn" onclick="deleteIcAgendaItem('${e(r.id)}')">🗑 Supprimer</button></div></article>`;
}
function agendaRows(){return A.rows.filter(r=>A.view==='past'?isPast(r):!isPast(r));}
window.renderIcAgenda=async function(){
 if(typeof main==='undefined'||!main)return;
 if(!logged()){
  main.innerHTML=`<div class="sectionhead"><div><h2>🗓️ Mon agenda</h2><p>Vos rendez-vous personnels dans Issoire Connect.</p></div></div><div class="card"><h3>Agenda personnel privé</h3><p>Connectez-vous pour noter vos rendez-vous, lieux et informations utiles.</p><button class="btn brand" onclick="authModal('agenda')">Connexion / inscription</button></div>`;
  return;
 }
 main.innerHTML='<div class="sectionhead"><div><h2>🗓️ Mon agenda</h2><p>Chargement de vos rendez-vous…</p></div></div><div class="empty">Chargement…</div>';
 try{await loadAgenda()}catch(err){main.innerHTML=`<div class="notice"><b>Impossible de charger votre agenda.</b><br>${e(err?.message||err)}</div>`;return}
 const rows=agendaRows(),next=A.rows.find(r=>!isPast(r));
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">🔒 PRIVÉ</span><h2 style="margin-top:8px">🗓️ Mon agenda</h2><p>Seul votre compte peut voir ces rendez-vous.</p></div><div class="actions"><button class="btn" onclick="go('home')">🏠 Accueil</button><button class="btn brand" onclick="openIcAgendaForm()">➕ Nouveau rendez-vous</button></div></div>${next?`<div class="notice"><b>Prochain rendez-vous :</b> ${e(next.title)} · ${e(fmtDate(next.starts_at))} à ${e(fmtTime(next.starts_at))}${next.place?' · 📍 '+e(next.place):''}</div>`:'<div class="notice"><b>Aucun rendez-vous à venir.</b> Utilisez « Nouveau rendez-vous » pour en ajouter un.</div>'}<div class="tabs" style="margin:14px 0"><button class="${A.view==='upcoming'?'active':''}" onclick="setIcAgendaView('upcoming')">À venir (${A.rows.filter(r=>!isPast(r)).length})</button><button class="${A.view==='past'?'active':''}" onclick="setIcAgendaView('past')">Passés (${A.rows.filter(isPast).length})</button></div>${rows.length?`<div class="cards">${rows.map(appointmentCard).join('')}</div>`:`<div class="empty">${A.view==='past'?'Aucun ancien rendez-vous.':'Aucun rendez-vous à venir.'}</div>`}`;
};
window.setIcAgendaView=function(view){A.view=view==='past'?'past':'upcoming';renderIcAgenda()};
window.openIcAgendaForm=function(id=''){
 if(!logged())return authModal('agenda');
 const r=id?A.rows.find(x=>x.id===id):null;if(id&&!r)return say('Rendez-vous introuvable.');
 const defaultStart=new Date(Date.now()+3600000);defaultStart.setMinutes(Math.ceil(defaultStart.getMinutes()/15)*15,0,0);
 const start=localInput(r?.starts_at||defaultStart),end=localInput(r?.ends_at||'');
 openModal(`<h2>${r?'✏️ Modifier le rendez-vous':'➕ Nouveau rendez-vous'}</h2><div class="notice">🔒 Ce rendez-vous reste privé dans votre compte Issoire Connect.</div><div class="form" style="margin-top:12px"><label>Titre *</label><input id="icaTitle" maxlength="160" value="${e(r?.title||'')}" placeholder="Médecin, garage, client, coiffeur…"><div class="two"><div><label>Date et heure *</label><input id="icaStart" type="datetime-local" value="${e(start)}"></div><div><label>Fin — facultatif</label><input id="icaEnd" type="datetime-local" value="${e(end)}"></div></div><label>Lieu — facultatif</label><input id="icaPlace" maxlength="250" value="${e(r?.place||'')}" placeholder="Adresse, cabinet, entreprise…"><label>Notes — facultatif</label><textarea id="icaNotes" rows="5" maxlength="3000" placeholder="Informations utiles pour ce rendez-vous">${e(r?.notes||'')}</textarea><button id="icaSave" class="btn brand" onclick="saveIcAgendaItem('${e(id)}')">💾 ${r?'Enregistrer':'Ajouter à mon agenda'}</button></div>`);
};
window.saveIcAgendaItem=async function(id=''){
 if(!logged())return authModal('agenda');
 const title=document.getElementById('icaTitle')?.value.trim()||'',startRaw=document.getElementById('icaStart')?.value||'',endRaw=document.getElementById('icaEnd')?.value||'';
 if(!title)return say('Indiquez le titre du rendez-vous.');if(!startRaw)return say('Indiquez la date et l’heure.');
 const starts_at=new Date(startRaw).toISOString(),ends_at=endRaw?new Date(endRaw).toISOString():null;if(ends_at&&new Date(ends_at)<new Date(starts_at))return say('L’heure de fin doit être après le début.');
 const payload={title,starts_at,ends_at,place:document.getElementById('icaPlace')?.value.trim()||null,notes:document.getElementById('icaNotes')?.value.trim()||null,updated_at:new Date().toISOString()};
 const btn=document.getElementById('icaSave');if(btn){btn.disabled=true;btn.textContent='Enregistrement…'}
 const q=id?sb.from('ic_personal_agenda').update(payload).eq('id',id).eq('user_id',S.session.user.id):sb.from('ic_personal_agenda').insert({...payload,user_id:S.session.user.id});
 const {error}=await q;if(error){if(btn){btn.disabled=false;btn.textContent='💾 Enregistrer'}return say(error.message)}closeModal();say(id?'Rendez-vous mis à jour.':'Rendez-vous ajouté à votre agenda.');await renderIcAgenda();
};
window.deleteIcAgendaItem=function(id){const r=A.rows.find(x=>x.id===id);if(!r)return;openModal(`<h2>🗑 Supprimer ce rendez-vous ?</h2><p><b>${e(r.title)}</b><br>${e(fmtDate(r.starts_at))} à ${e(fmtTime(r.starts_at))}</p><div class="actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="confirmDeleteIcAgendaItem('${e(id)}')">Supprimer</button></div>`)};
window.confirmDeleteIcAgendaItem=async function(id){if(!logged())return;const {error}=await sb.from('ic_personal_agenda').delete().eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);closeModal();say('Rendez-vous supprimé.');await renderIcAgenda()};

window.addIcEventToAgenda=async function(eventId){
 if(!logged())return authModal('events');const ev=(S.events||[]).find(x=>x.id===eventId);if(!ev)return say('Événement introuvable.');
 const {data:already,error:checkError}=await sb.from('ic_personal_agenda').select('id').eq('user_id',S.session.user.id).eq('source_event_id',eventId).maybeSingle();if(checkError)return say(checkError.message);if(already?.id)return say('Cet événement est déjà dans votre agenda.');
 const payload={user_id:S.session.user.id,title:ev.title||'Événement',starts_at:ev.starts_at,ends_at:ev.ends_at||null,place:ev.place||null,notes:ev.description||null,source_event_id:ev.id,updated_at:new Date().toISOString()};
 const {error}=await sb.from('ic_personal_agenda').insert(payload);if(error)return say(error.message);say('Événement ajouté à votre agenda.')
};
function decoratePublicEvents(){
 if(typeof main==='undefined'||!main)return;
 const events=S.events||[];for(const card of main.querySelectorAll('.card')){
  if(card.querySelector('[data-add-agenda]'))continue;const title=card.querySelector('h3')?.textContent?.trim();if(!title)continue;const ev=events.find(x=>String(x.title||'').trim()===title);if(!ev)continue;
  let actions=card.querySelector('.actions');if(!actions){actions=document.createElement('div');actions.className='actions';card.appendChild(actions)}
  const b=document.createElement('button');b.className='btn';b.dataset.addAgenda='1';b.textContent='🗓️ Ajouter à mon agenda';b.onclick=()=>addIcEventToAgenda(ev.id);actions.appendChild(b);
 }
}

window.menu=function(){
 const items=[['🏢','Entreprises & commerces','businesses'],['🔥','Bons plans','deals'],['💼','Emplois','jobs'],['📣','Annonces & besoins','classifieds'],['🗓️','Mon agenda','agenda'],['📅','Événements','events'],['📍','Autour de moi','nearby']];
 return `<div class="gridmenu">${items.map(x=>`<button class="tile" onclick="go('${x[2]}')"><span>${x[0]}</span><b>${x[1]}</b></button>`).join('')}</div>`;
};

const baseGo=window.go;
if(typeof baseGo==='function')window.go=function(page,...args){
 const r=baseGo.call(this,page,...args);
 if(page==='agenda')setTimeout(()=>renderIcAgenda(),0);
 if(page==='events')setTimeout(decoratePublicEvents,100);
 if(page==='home')setTimeout(()=>{if(typeof homePage==='function'&&S.page==='home')homePage()},0);
 return r;
};

setTimeout(()=>{
 if(S.page==='home'&&typeof homePage==='function')homePage();
 if(S.page==='agenda')renderIcAgenda();
 if(S.page==='events')decoratePublicEvents();
},250);
window.icAgenda={version:'43.0',load:loadAgenda,render:window.renderIcAgenda};
})();


;/* ===== admin-users-v44.js ===== */
(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const A={users:[],current:null};
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const admin=()=>!!(S.session&&S.profile?.role==='admin');
const fmt=v=>{try{return v?new Date(v).toLocaleString('fr-FR'):'—'}catch{return'—'}};
const planLabel=p=>p==='essential'?'Pro Local':(['pro','proplus'].includes(String(p))?'Pro 360':p||'Habitant');
const statusLabel=s=>s==='active'?'Actif':s==='trialing'?'Essai':s||'—';
const isNew=v=>{const t=new Date(v).getTime();return Number.isFinite(t)&&Date.now()-t<7*86400000};

const baseAdminLoadTab=window.adminLoadTab;
window.adminLoadTab=async function(tab,q='',keepShell=false){
 if(tab!=='profiles'||typeof baseAdminLoadTab!=='function')return typeof baseAdminLoadTab==='function'?baseAdminLoadTab(tab,q,keepShell):null;
 await baseAdminLoadTab(tab,'',keepShell);
 return renderIcAdminUsersV44(q);
};

window.renderIcAdminUsersV44=async function(q=''){
 if(!admin())return typeof say==='function'?say('Accès administrateur requis.'):null;
 const host=document.getElementById('adminList');if(!host)return;
 const input=document.getElementById('adminSearch');if(input){input.placeholder='Rechercher par email, nom, ville ou entreprise';input.value=q||''}
 host.innerHTML='<div class="empty">Chargement de tous les comptes inscrits…</div>';
 const {data,error}=await sb.rpc('ic_admin_user_directory_v2',{p_search:q||null,p_limit:500});
 if(error){host.innerHTML=`<div class="notice"><b>Impossible de charger les utilisateurs.</b><br>${e(error.message)}</div>`;return}
 A.users=data||[];
 const confirmed=A.users.filter(x=>x.email_confirmed).length;
 const recent=A.users.filter(x=>isNew(x.created_at)).length;
 host.innerHTML=`<div class="sectionhead"><div><h2>👥 Utilisateurs inscrits</h2><p><b>${A.users.length}</b> compte(s) réel(s) · ${confirmed} email(s) confirmé(s) · ${recent} nouveau(x) sur 7 jours.</p></div><button class="btn" onclick="renderIcAdminUsersV44(document.getElementById('adminSearch')?.value||'')">↻ Actualiser</button></div><div class="notice"><b>Cette liste vient directement de l’authentification Supabase.</b><br>Un compte apparaît ici même si son nom ou son profil n’est pas encore complété.</div>${A.users.length?`<div class="cards">${A.users.map(userCard).join('')}</div>`:'<div class="empty">Aucun utilisateur ne correspond à la recherche.</div>'}`;
};

function userCard(u){
 const label=u.display_name||u.email||'Utilisateur';
 const role=u.role==='admin'?'Administrateur':u.role==='pro'?'Professionnel':'Habitant';
 const badges=`${isNew(u.created_at)?'<span class="pill">🆕 NOUVEAU</span>':''}<span class="pill">${u.email_confirmed?'✅ Email confirmé':'⚠️ Email non confirmé'}</span><span class="pill">${e(role)}</span>`;
 const activity=Number(u.classified_count||0)+Number(u.need_count||0)+Number(u.event_count||0)+Number(u.application_count||0);
 return `<article class="card"><div class="row between"><div>${badges}<h3 style="margin:8px 0 2px">${e(label)}</h3><div class="muted">✉️ ${e(u.email||'Email indisponible')}</div></div>${S.session?.user?.id===u.id?'<span class="pill">TON COMPTE</span>':''}</div><div class="muted" style="margin-top:8px">🗓 Inscrit : ${e(fmt(u.created_at))}<br>🟢 Dernière connexion : ${e(fmt(u.last_sign_in_at))}<br>📍 ${e(u.city||'Issoire')} ${e(u.postal_code||'')} · ${Number(u.radius_km||10)} km${u.business_name?`<br>🏪 ${e(u.business_name)}`:''}<br>💳 ${e(planLabel(u.subscription_plan))}${u.subscription_status?' · '+e(statusLabel(u.subscription_status)):''}<br>📚 Activité : ${activity} élément(s)</div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="openIcAdminUserV44('${e(u.id)}')">👁 Voir / intervenir</button></div></article>`;
}

window.openIcAdminUserV44=async function(id){
 if(!admin())return;
 const basic=A.users.find(x=>x.id===id);if(!basic)return say('Utilisateur introuvable.');
 openModal(`<h2>👤 Profil utilisateur</h2><div class="empty">Chargement des informations…</div>`);
 const {data,error}=await sb.rpc('ic_admin_user_overview',{p_user:id});
 if(error){modalBody.innerHTML=`<h2>👤 Profil utilisateur</h2><div class="notice">${e(error.message)}</div>`;return}
 A.current=data||{};const u=A.current.user||{},p=A.current.profile||{},c=A.current.counts||{},businesses=A.current.businesses||[],sub=A.current.subscription||{};
 const role=p.role||basic.role||'resident',self=S.session?.user?.id===id;
 modalBody.innerHTML=`<h2>👤 ${e(p.display_name||u.email||'Utilisateur')}</h2><div class="notice"><b>${e(u.email||'')}</b><br>${u.email_confirmed?'✅ Adresse email confirmée':'⚠️ Adresse email non confirmée'}<br>Inscription : ${e(fmt(u.created_at))}<br>Dernière connexion : ${e(fmt(u.last_sign_in_at))}</div><div class="two" style="margin-top:12px"><div class="card"><h3>📊 Activité</h3><p>📣 Annonces : <b>${Number(c.classifieds||0)}</b><br>🙋 Besoins : <b>${Number(c.needs||0)}</b><br>📅 Événements : <b>${Number(c.events||0)}</b><br>💼 Candidatures : <b>${Number(c.applications||0)}</b><br>💬 Messages liés : <b>${Number(c.messages||0)}</b></p></div><div class="card"><h3>🏪 Professionnel</h3><p>${businesses.length?businesses.map(b=>`${e(b.name||'Entreprise')} · ${e(b.city||'')} · ${e(planLabel(b.plan))}`).join('<br>'):'Aucune entreprise liée.'}</p><p><b>Abonnement :</b> ${e(planLabel(sub.plan))}${sub.status?' · '+e(statusLabel(sub.status)):''}</p>${businesses[0]?.id?`<button class="btn" onclick="closeModal();viewBusiness('${e(businesses[0].id)}')">Voir l’établissement</button>`:''}</div></div><div class="form" style="margin-top:12px"><h3>✏️ Modifier le profil</h3><label>Nom affiché</label><input id="v44Name" value="${e(p.display_name||'')}"><label>Type de compte</label>${role==='admin'?`<input value="Administrateur" disabled><small class="muted">Le rôle administrateur est protégé et ne se modifie pas depuis cette fiche.</small>`:`<select id="v44Role"><option value="resident" ${role==='resident'?'selected':''}>Habitant</option><option value="pro" ${role==='pro'?'selected':''}>Professionnel</option></select>`}<div class="two"><div><label>Ville</label><input id="v44City" value="${e(p.city||basic.city||'Issoire')}"></div><div><label>Code postal</label><input id="v44Postal" value="${e(p.postal_code||basic.postal_code||'63500')}"></div></div><label>Rayon</label><select id="v44Radius">${[1,5,10,20,50].map(r=>`<option value="${r}" ${Number(p.radius_km||basic.radius_km||10)===r?'selected':''}>${r} km</option>`).join('')}</select><div class="actions"><button class="btn brand" onclick="saveIcAdminUserV44('${e(id)}','${e(role)}')">💾 Enregistrer</button>${!u.email_confirmed?`<button class="btn" onclick="resendIcAdminConfirmationV44('${e(u.email||'')}')">📨 Renvoyer confirmation</button>`:''}<button class="btn" onclick="sendIcAdminPasswordResetV44('${e(u.email||'')}')">🔑 Envoyer réinitialisation mot de passe</button></div></div>${self?'<div class="notice">Ton propre compte administrateur reste protégé contre un changement de rôle accidentel.</div>':''}`;
};

window.saveIcAdminUserV44=async function(id,currentRole){
 if(!admin())return;
 const role=currentRole==='admin'?'admin':(document.getElementById('v44Role')?.value||'resident');
 const {error}=await sb.rpc('ic_admin_update_user_profile',{p_user:id,p_display_name:document.getElementById('v44Name')?.value.trim()||null,p_role:role,p_city:document.getElementById('v44City')?.value.trim()||'Issoire',p_postal_code:document.getElementById('v44Postal')?.value.trim()||'63500',p_radius_km:Number(document.getElementById('v44Radius')?.value||10)});
 if(error)return say(error.message);closeModal();say('Profil utilisateur mis à jour.');await renderIcAdminUsersV44(document.getElementById('adminSearch')?.value||'');
};
window.resendIcAdminConfirmationV44=async function(email){if(!admin()||!email)return;const {error}=await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:location.origin+location.pathname}});if(error)return say(error.message);say('Nouvel email de confirmation envoyé.')};
window.sendIcAdminPasswordResetV44=async function(email){if(!admin()||!email)return;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)return say(error.message);say('Email de réinitialisation envoyé à l’utilisateur.')};
window.icAdminUsersV44={version:'44.0'};
})();

;/* ===== admin-owner-v45.js ===== */
(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const A={allowed:false,users:[],tab:'users'};
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=v=>{try{return v?new Date(v).toLocaleString('fr-FR'):'—'}catch{return'—'}};
const plan=p=>p==='essential'?'Pro Local':(['pro','proplus'].includes(String(p))?'Pro 360':p||'Habitant');
const roleLabel=r=>r==='pro'?'Professionnel':r==='admin'?'Administrateur':'Habitant';
async function isAllowed(){
 if(!S.session){A.allowed=false;return false}
 try{const {data,error}=await sb.rpc('ic_is_admin');A.allowed=!error&&data===true}catch{A.allowed=false}
 return A.allowed;
}
function removeButton(){document.getElementById('icOwnerAdminBtn')?.remove()}
function injectButton(){
 removeButton();if(!A.allowed||!S.session)return;
 const b=document.createElement('button');b.id='icOwnerAdminBtn';b.type='button';b.textContent='👑 Administration';b.onclick=()=>openIcOwnerAdmin();
 b.style.cssText='position:fixed;right:16px;bottom:18px;z-index:2147483000;border:0;border-radius:999px;padding:12px 16px;background:#123d73;color:#fff;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer';
 document.body.appendChild(b);
}
async function refreshAccess(){await isAllowed();injectButton()}
window.openIcOwnerAdmin=async function(tab='users'){
 if(!(await isAllowed()))return typeof say==='function'?say('Accès administration non autorisé.'):null;
 A.tab=tab;
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">👑 ACCÈS PRIVÉ</span><h2 style="margin-top:8px">Administration Issoire Connect</h2><p>Réservé aux comptes administrateurs autorisés côté serveur.</p></div><div class="actions"><button class="btn" onclick="go('account')">← Mon compte</button></div></div><div class="notice"><b>Administration séparée de ton profil Pro 360.</b><br>Tu gardes ton espace Pro normal et ce bouton ouvre uniquement les outils d’administration.</div><div class="actions" style="gap:8px;flex-wrap:wrap;margin:14px 0"><button class="btn ${tab==='users'?'brand':''}" onclick="openIcOwnerAdmin('users')">👥 Utilisateurs</button><button class="btn ${tab==='businesses'?'brand':''}" onclick="openIcOwnerAdmin('businesses')">🏪 Entreprises</button><button class="btn ${tab==='subscriptions'?'brand':''}" onclick="openIcOwnerAdmin('subscriptions')">💳 Abonnements</button><button class="btn ${tab==='activity'?'brand':''}" onclick="openIcOwnerAdmin('activity')">📊 Activité</button></div><div id="icOwnerAdminBody"><div class="empty">Chargement…</div></div>`;
 if(tab==='users')return renderUsers();if(tab==='businesses')return renderBusinesses();if(tab==='subscriptions')return renderSubscriptions();return renderActivity();
};
async function renderUsers(q=''){
 const host=document.getElementById('icOwnerAdminBody');if(!host)return;
 host.innerHTML=`<div class="card"><div class="row"><input id="icAdminUserSearch" style="flex:1" placeholder="Rechercher email, nom, ville, entreprise" value="${e(q)}"><button class="btn brand" onclick="searchIcOwnerUsers()">🔎</button><button class="btn" onclick="renderIcOwnerUsersNow()">↻</button></div></div><div class="empty">Chargement des comptes réels…</div>`;
 const {data,error}=await sb.rpc('ic_admin_user_directory_v2',{p_search:q||null,p_limit:500});
 if(error){host.innerHTML=`<div class="notice">${e(error.message)}</div>`;return}
 A.users=data||[];const recent=A.users.filter(u=>Date.now()-new Date(u.created_at).getTime()<7*86400000).length;
 host.innerHTML=`<div class="sectionhead"><div><h2>👥 Tous les inscrits</h2><p><b>${A.users.length}</b> compte(s) Auth réels · ${recent} nouveau(x) sur 7 jours.</p></div></div><div class="card"><div class="row"><input id="icAdminUserSearch" style="flex:1" placeholder="Rechercher email, nom, ville, entreprise" value="${e(q)}"><button class="btn brand" onclick="searchIcOwnerUsers()">🔎</button><button class="btn" onclick="renderIcOwnerUsersNow()">↻</button></div></div><div class="cards">${A.users.map(userCard).join('')}</div>`;
}
function userCard(u){
 const activity=Number(u.classified_count||0)+Number(u.need_count||0)+Number(u.event_count||0)+Number(u.application_count||0);
 const isNew=Date.now()-new Date(u.created_at).getTime()<7*86400000;
 return `<article class="card"><div class="row between"><div>${isNew?'<span class="pill">🆕 NOUVEAU</span>':''}<span class="pill">${u.email_confirmed?'✅ Email confirmé':'⚠️ Non confirmé'}</span><span class="pill">${e(roleLabel(u.role))}</span><h3 style="margin:7px 0 2px">${e(u.display_name||u.email||'Utilisateur')}</h3><div class="muted">${e(u.email||'')}</div></div>${S.session?.user?.id===u.id?'<span class="pill">TON COMPTE</span>':''}</div><div class="muted" style="margin-top:8px">Inscrit : ${e(fmt(u.created_at))}<br>Dernière connexion : ${e(fmt(u.last_sign_in_at))}<br>📍 ${e(u.city||'Issoire')} ${e(u.postal_code||'')} · ${Number(u.radius_km||10)} km${u.business_name?`<br>🏪 ${e(u.business_name)}`:''}<br>💳 ${e(plan(u.subscription_plan))}${u.subscription_status?' · '+e(u.subscription_status):''}<br>📚 Activité publique : ${activity}</div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="openIcOwnerUser('${e(u.id)}')">👁 Profil & interventions</button></div></article>`;
}
window.searchIcOwnerUsers=()=>renderUsers(document.getElementById('icAdminUserSearch')?.value.trim()||'');
window.renderIcOwnerUsersNow=()=>renderUsers(document.getElementById('icAdminUserSearch')?.value.trim()||'');
window.openIcOwnerUser=async function(id){
 if(!(await isAllowed()))return;openModal('<h2>👤 Profil utilisateur</h2><div class="empty">Chargement…</div>');
 const {data,error}=await sb.rpc('ic_admin_user_overview',{p_user:id});if(error){modalBody.innerHTML=`<div class="notice">${e(error.message)}</div>`;return}
 const u=data?.user||{},p=data?.profile||{},c=data?.counts||{},bs=data?.businesses||[],sub=data?.subscription||{};const currentRole=p.role||'resident';
 modalBody.innerHTML=`<h2>👤 ${e(p.display_name||u.email||'Utilisateur')}</h2><div class="notice"><b>${e(u.email||'')}</b><br>${u.email_confirmed?'✅ Email confirmé':'⚠️ Email non confirmé'}<br>Inscrit : ${e(fmt(u.created_at))}<br>Dernière connexion : ${e(fmt(u.last_sign_in_at))}</div><div class="two" style="margin-top:10px"><div class="card"><h3>📊 Activité</h3><p>📣 Annonces : <b>${Number(c.classifieds||0)}</b><br>🙋 Besoins : <b>${Number(c.needs||0)}</b><br>📅 Événements : <b>${Number(c.events||0)}</b><br>💼 Candidatures : <b>${Number(c.applications||0)}</b><br>💬 Messages liés : <b>${Number(c.messages||0)}</b></p></div><div class="card"><h3>🏪 Professionnel</h3><p>${bs.length?bs.map(b=>`${e(b.name||'Entreprise')} · ${e(b.city||'')} · ${e(plan(b.plan))}`).join('<br>'):'Aucune entreprise liée.'}</p><p><b>Abonnement :</b> ${e(plan(sub.plan))}${sub.status?' · '+e(sub.status):''}</p></div></div><div class="form"><h3>✏️ Modifier le profil</h3><label>Nom affiché</label><input id="ic45Name" value="${e(p.display_name||'')}"><label>Type de compte</label>${currentRole==='admin'?'<input value="Administrateur" disabled>':`<select id="ic45Role"><option value="resident" ${currentRole==='resident'?'selected':''}>Habitant</option><option value="pro" ${currentRole==='pro'?'selected':''}>Professionnel</option></select>`}<div class="two"><div><label>Ville</label><input id="ic45City" value="${e(p.city||'Issoire')}"></div><div><label>Code postal</label><input id="ic45Postal" value="${e(p.postal_code||'63500')}"></div></div><label>Rayon</label><select id="ic45Radius">${[1,5,10,20,50].map(r=>`<option value="${r}" ${Number(p.radius_km||10)===r?'selected':''}>${r} km</option>`).join('')}</select><div class="actions"><button class="btn brand" onclick="saveIcOwnerUser('${e(id)}','${e(currentRole)}')">💾 Enregistrer</button>${!u.email_confirmed?`<button class="btn" onclick="resendIcOwnerConfirmation('${e(u.email||'')}')">📨 Renvoyer confirmation</button>`:''}<button class="btn" onclick="sendIcOwnerPasswordReset('${e(u.email||'')}')">🔑 Réinitialisation mot de passe</button></div></div><div class="notice">🔒 Les mots de passe et le contenu de l’agenda personnel ne sont jamais affichés dans l’administration.</div>`;
};
window.saveIcOwnerUser=async function(id,currentRole){if(!(await isAllowed()))return;const role=currentRole==='admin'?'admin':(document.getElementById('ic45Role')?.value||'resident');const {error}=await sb.rpc('ic_admin_update_user_profile',{p_user:id,p_display_name:document.getElementById('ic45Name')?.value.trim()||null,p_role:role,p_city:document.getElementById('ic45City')?.value.trim()||'Issoire',p_postal_code:document.getElementById('ic45Postal')?.value.trim()||'63500',p_radius_km:Number(document.getElementById('ic45Radius')?.value||10)});if(error)return say(error.message);closeModal();say('Profil mis à jour.');renderUsers()};
window.resendIcOwnerConfirmation=async email=>{if(!(await isAllowed())||!email)return;const {error}=await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:location.origin+location.pathname}});if(error)return say(error.message);say('Email de confirmation renvoyé.')};
window.sendIcOwnerPasswordReset=async email=>{if(!(await isAllowed())||!email)return;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)return say(error.message);say('Email de réinitialisation envoyé.')};
async function renderBusinesses(){const host=document.getElementById('icOwnerAdminBody');const {data,error}=await sb.from('ic_businesses').select('id,name,owner_id,category,city,postal_code,plan,is_active,is_claimed,source,created_at').order('created_at',{ascending:false}).limit(200);if(error){host.innerHTML=`<div class="notice">${e(error.message)}</div>`;return}host.innerHTML=`<div class="sectionhead"><div><h2>🏪 Entreprises</h2><p>${(data||[]).length} fiche(s) récente(s).</p></div></div><div class="cards">${(data||[]).map(b=>`<article class="card"><span class="pill">${b.is_active?'🟢 Active':'⚪ Inactive'}</span><span class="pill">${b.is_claimed?'✓ revendiquée':'non revendiquée'}</span><h3>${e(b.name||'Entreprise')}</h3><div class="muted">${e(b.category||'')} · ${e(b.city||'')} ${e(b.postal_code||'')}<br>Forfait : ${e(plan(b.plan))} · source : ${e(b.source||'—')}<br>Créée : ${e(fmt(b.created_at))}</div></article>`).join('')}</div>`};
async function renderSubscriptions(){const host=document.getElementById('icOwnerAdminBody');const {data,error}=await sb.from('ic_subscriptions').select('user_id,plan,status,livemode,current_period_end,cancel_at_period_end,created_at,updated_at').order('updated_at',{ascending:false}).limit(200);if(error){host.innerHTML=`<div class="notice">${e(error.message)}</div>`;return}host.innerHTML=`<div class="sectionhead"><div><h2>💳 Abonnements</h2><p>${(data||[]).length} abonnement(s).</p></div></div><div class="cards">${(data||[]).map(s=>`<article class="card"><span class="pill">${e(plan(s.plan))}</span><span class="pill">${e(s.status||'')}</span><h3>${e(String(s.user_id).slice(0,8))}</h3><div class="muted">${s.livemode?'LIVE':'TEST'}${s.current_period_end?'<br>Fin période : '+e(fmt(s.current_period_end)):''}${s.cancel_at_period_end?'<br>Annulation prévue':''}<br>Mis à jour : ${e(fmt(s.updated_at))}</div></article>`).join('')}</div>`};
async function renderActivity(){const host=document.getElementById('icOwnerAdminBody');const tables=[['Utilisateurs','ic_profiles'],['Entreprises','ic_businesses'],['Annonces','ic_classifieds'],['Besoins','ic_needs'],['Événements','ic_events'],['Emplois','ic_jobs'],['Produits/services','ic_products'],['Avantages','ic_offers'],['Messages','ic_messages']];const rows=[];for(const [label,table] of tables){const {count,error}=await sb.from(table).select('*',{count:'exact',head:true});rows.push([label,error?'—':count])}host.innerHTML=`<div class="sectionhead"><div><h2>📊 Activité globale</h2><p>Vue de gestion générale.</p></div></div><div class="cards">${rows.map(([l,c])=>`<article class="card"><h3>${e(l)}</h3><div style="font-size:30px;font-weight:900">${e(c)}</div></article>`).join('')}</div>`};
try{sb.auth.onAuthStateChange(()=>setTimeout(refreshAccess,150))}catch{}
setTimeout(refreshAccess,500);
window.icOwnerAdminV45={version:'45.0',refresh:refreshAccess};
})();

;/* ===== reliability-v46.js ===== */
(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const esc46=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const byId=(rows,id)=>(rows||[]).find(x=>String(x?.id)===String(id));
const mergeBusiness=fresh=>{
 if(!fresh?.id)return fresh;
 const i=(S.businesses||[]).findIndex(x=>x.id===fresh.id);
 if(i>=0)Object.assign(S.businesses[i],fresh);else{S.businesses=S.businesses||[];S.businesses.push(fresh)}
 const j=(S.myBusinesses||[]).findIndex(x=>x.id===fresh.id);
 if(j>=0)Object.assign(S.myBusinesses[j],fresh);
 return i>=0?S.businesses[i]:fresh;
};

async function loadBusinessAuthority(id){
 const {data,error}=await sb.from('ic_businesses').select('id,owner_id,is_claimed,source,name,phone,website,plan,is_active').eq('id',id).maybeSingle();
 if(error)throw error;
 return mergeBusiness(data);
}
window.icV46LoadBusinessAuthority=loadBusinessAuthority;

// L'annuaire public charge beaucoup de fiches allégées. Avant d'ouvrir une fiche,
// on recharge uniquement l'autorité de contact de cette entreprise afin de ne
// jamais confondre « fiche revendiquée » et « fiche sans destinataire ».
const oldOpenDirectoryBusiness=window.openDirectoryBusiness;
if(typeof oldOpenDirectoryBusiness==='function')window.openDirectoryBusiness=async function(id){
 try{await loadBusinessAuthority(id)}catch(err){console.warn('IC V46 business authority',err?.message||err)}
 return oldOpenDirectoryBusiness(id);
};

// Même protection si une autre route ouvre directement une fiche entreprise.
const oldViewBusiness=window.viewBusiness;
if(typeof oldViewBusiness==='function')window.viewBusiness=function(id){
 const known=byId(S.businesses,id);
 if(known&&known.owner_id!==undefined)return oldViewBusiness(id);
 loadBusinessAuthority(id).then(()=>oldViewBusiness(id)).catch(()=>oldViewBusiness(id));
};

function publicContactHtml(b){
 const phone=String(b?.phone||'').trim();
 let site='';
 try{if(b?.website){const u=new URL(/^https?:\/\//i.test(b.website)?b.website:'https://'+b.website);if(/^https?:$/.test(u.protocol))site=u.href}}catch{}
 const actions=[];
 if(phone)actions.push(`<a class="btn brand" href="tel:${esc46(phone.replace(/[^\d+]/g,''))}">☎ Appeler</a>`);
 if(site)actions.push(`<a class="btn" href="${esc46(site)}" target="_blank" rel="noopener">🌐 Site internet</a>`);
 if(!b?.owner_id&&b?.source==='sirene_officiel'&&!b?.is_claimed&&typeof window.openClaimBusiness==='function')actions.push(`<button class="btn" onclick="closeModal();openClaimBusiness('${esc46(b.id)}')">🏪 C’est mon entreprise</button>`);
 return actions.join('');
}

// Un clic « message » ne doit jamais mener à un formulaire sans destinataire.
const oldMessageBusiness=window.messageBusiness;
if(typeof oldMessageBusiness==='function')window.messageBusiness=async function(id){
 let b=byId(S.businesses,id);
 if(!b||b.owner_id===undefined){try{b=await loadBusinessAuthority(id)}catch{}}
 if(!b)return typeof say==='function'?say('Établissement introuvable.'):null;
 if(!b.owner_id){
   const actions=publicContactHtml(b)||'<button class="btn" onclick="closeModal()">Fermer</button>';
   return openModal(`<h2>💬 Contacter ${esc46(b.name||'ce professionnel')}</h2><div class="notice"><b>Messagerie Issoire Connect non disponible pour cette fiche.</b><br>Aucun compte professionnel n’est encore relié à cet établissement.</div><p>Utilisez ses coordonnées publiques${b?.source==='sirene_officiel'&&!b?.is_claimed?' ou revendiquez la fiche si vous représentez cette entreprise':''}.</p><div class="actions">${actions}</div>`);
 }
 return oldMessageBusiness(id);
};

// Les anciennes cartes peuvent encore contenir un bouton de réservation alors
// que l'offre n'est pas réservable. V46 remplace ce CTA par une action honnête.
function syncReservationButtons(root=document){
 root.querySelectorAll?.('[onclick*="reserveOffer("]').forEach(btn=>{
   const m=(btn.getAttribute('onclick')||'').match(/reserveOffer\('([^']+)'\)/);if(!m)return;
   const offer=byId(S.offers,m[1]);if(!offer||offer.reservation_enabled===true)return;
   const b=byId(S.businesses,offer.business_id);
   if(b){btn.setAttribute('onclick',`viewBusiness('${b.id}')`);btn.textContent='Voir le professionnel';btn.title='Cette offre ne propose pas de réservation en ligne.'}
   else{btn.removeAttribute('onclick');btn.disabled=true;btn.textContent='Réservation indisponible'}
 });
}
const observer=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)syncReservationButtons(n)});
observer.observe(document.body,{childList:true,subtree:true});
setTimeout(()=>syncReservationButtons(document),100);

// ---------------------------------------------------------------------------
// Administration V46 : revue des fiches similaires, sans suppression automatique.
// Même nom + même adresse ne signifie pas nécessairement même entité juridique.
// ---------------------------------------------------------------------------
function relatedCount(b){return ['products','offers','jobs','messages','orders','followers','claims'].reduce((n,k)=>n+Number(b?.[k]||0),0)}
function duplicateBusinessCard(b){
 const linked=relatedCount(b),protectedRow=!!b.owner_id||!!b.is_claimed||linked>0;
 return `<article class="card" style="margin:8px 0"><div class="row between"><div><span class="pill">${protectedRow?'🔴 LIENS À PRÉSERVER':'⚪ SANS LIEN'}</span><h3 style="margin:7px 0 2px">${esc46(b.name||'Entreprise')}</h3></div><span class="pill">${esc46(b.naf_code||'NAF ?')}</span></div><div class="muted">SIRET : <b>${esc46(b.siret||'—')}</b><br>SIREN : ${esc46(b.siren||'—')}<br>Activité : ${esc46(b.category||'—')}<br>Source : ${esc46(b.source||'—')} · ${b.owner_id?'compte professionnel lié':'aucun propriétaire lié'}</div><div class="notice" style="margin-top:8px">Produits/services : <b>${Number(b.products||0)}</b> · Avantages : <b>${Number(b.offers||0)}</b> · Emplois : <b>${Number(b.jobs||0)}</b><br>Messages : <b>${Number(b.messages||0)}</b> · Commandes : <b>${Number(b.orders||0)}</b> · Abonnés : <b>${Number(b.followers||0)}</b> · Revendications : <b>${Number(b.claims||0)}</b></div></article>`;
}
async function renderDuplicateReview(){
 const host=document.getElementById('icOwnerAdminBody');if(!host)return;
 host.innerHTML='<div class="empty">Analyse des fiches similaires…</div>';
 const {data,error}=await sb.rpc('ic_admin_duplicate_business_candidates',{p_limit:150});
 if(error){host.innerHTML=`<div class="notice"><b>Impossible de charger la revue.</b><br>${esc46(error.message)}</div>`;return}
 const groups=data||[];
 host.innerHTML=`<div class="sectionhead"><div><h2>🧬 Fiches similaires à vérifier</h2><p><b>${groups.length}</b> groupe(s) avec le même nom et la même adresse.</p></div></div><div class="notice"><b>Aucune suppression automatique.</b><br>Deux fiches identiques visuellement peuvent avoir des SIRET et des activités NAF différents : exploitant, propriétaire des murs, ancienne/nouvelle société, etc. Une fiche reliée à un compte ou à de l’activité doit toujours être préservée.</div>${groups.length?groups.map(g=>{const rows=Array.isArray(g.businesses)?g.businesses:[];const sirets=new Set(rows.map(x=>x.siret).filter(Boolean));const nafs=new Set(rows.map(x=>x.naf_code).filter(Boolean));const legal=sirets.size>1?'SIRET distincts':sirets.size===1?'Même SIRET':'SIRET incomplet';const activity=nafs.size>1?'activités NAF différentes':'activité NAF identique ou proche';return `<section class="card" style="margin:12px 0;border-left:4px solid #f47721"><div class="row between"><div><span class="pill">${Number(g.candidate_count||rows.length)} FICHES</span><h3 style="margin:7px 0 2px">${esc46(g.display_name)}</h3><div class="muted">${esc46(g.display_address||'')} ${esc46(g.postal_code||'')}</div></div><span class="pill">⚠️ À VÉRIFIER</span></div><p><b>${esc46(legal)}</b> · ${esc46(activity)}.</p>${rows.map(duplicateBusinessCard).join('')}</section>`}).join(''):'<div class="empty">Aucune fiche similaire détectée.</div>'}`;
}
function injectDuplicateTab(active){
 const activity=[...document.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("openIcOwnerAdmin('activity')"));
 if(!activity)return;
 let btn=document.getElementById('icV46DuplicateTab');
 if(!btn){btn=document.createElement('button');btn.id='icV46DuplicateTab';btn.className='btn';btn.textContent='🧬 Fiches similaires';btn.onclick=()=>window.openIcOwnerAdmin('duplicates');activity.insertAdjacentElement('afterend',btn)}
 btn.classList.toggle('brand',active==='duplicates');
 if(active==='duplicates')document.querySelectorAll("button[onclick*='openIcOwnerAdmin']").forEach(b=>{if(b.id!=='icV46DuplicateTab')b.classList.remove('brand')});
}
const oldOwnerAdmin=window.openIcOwnerAdmin;
if(typeof oldOwnerAdmin==='function')window.openIcOwnerAdmin=async function(tab='users'){
 const base=tab==='duplicates'?'businesses':tab;
 const result=await oldOwnerAdmin(base);
 injectDuplicateTab(tab);
 if(tab==='duplicates')await renderDuplicateReview();
 return result;
};

window.icV46Reliability={version:'46.0',loadBusinessAuthority,syncReservationButtons,renderDuplicateReview};
})();

;/* ===== reviews-messaging-v47-patch.js ===== */
(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const V='47.0';
const C={conversations:[],current:null,route:'',timer:null};
const $=id=>document.getElementById(id);
const mainEl=()=>document.getElementById('main');
const modalEl=()=>document.getElementById('modalBody');
const esc47=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt47=v=>{try{return v?new Date(v).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}):'—'}catch{return'—'}};
const stars=n=>`${'★'.repeat(Math.max(0,Math.min(5,Math.round(Number(n)||0))))}${'☆'.repeat(5-Math.max(0,Math.min(5,Math.round(Number(n)||0))))}`;
const businessById=id=>(S.businesses||[]).find(x=>String(x?.id)===String(id))||(S.myBusinesses||[]).find(x=>String(x?.id)===String(id));
const uuidArg=v=>v?`'${esc47(v)}'`:'null';

async function loadBusiness(id){
 try{if(typeof window.icV46LoadBusinessAuthority==='function')return await window.icV46LoadBusinessAuthority(id)}catch{}
 const {data,error}=await sb.from('ic_businesses').select('id,name,owner_id,is_claimed,source,phone,website,is_active').eq('id',id).maybeSingle();
 if(error)throw error;
 if(data){S.businesses=S.businesses||[];const i=S.businesses.findIndex(x=>x.id===data.id);if(i>=0)Object.assign(S.businesses[i],data);else S.businesses.push(data)}
 return data;
}

async function reviewData(id){
 const [s,r]=await Promise.all([
   sb.rpc('ic_business_review_summary',{p_business:id}),
   sb.rpc('ic_business_reviews',{p_business:id,p_limit:50,p_offset:0})
 ]);
 if(s.error)throw s.error;if(r.error)throw r.error;
 return {summary:Array.isArray(s.data)?s.data[0]:s.data,reviews:r.data||[]};
}

function reviewCard(b,r,isOwner){
 const mine=r.is_mine===true;
 const verified=r.is_verified===true?'<span class="pill">✅ Avis vérifié</span>':'<span class="pill">👤 Avis membre</span>';
 const reply=r.business_reply?`<div class="notice" style="margin-top:9px"><b>Réponse du professionnel</b><br>${esc47(r.business_reply)}<div class="muted" style="margin-top:4px">${esc47(fmt47(r.replied_at))}</div></div>`:'';
 const actions=[];
 if(mine)actions.push(`<button class="btn" onclick="openIc47ReviewForm('${esc47(b.id)}')">✏️ Modifier</button><button class="btn" onclick="deleteIc47Review('${esc47(b.id)}','${esc47(r.id)}')">🗑 Supprimer</button>`);
 if(isOwner)actions.push(`<button class="btn" onclick="openIc47ReviewReply('${esc47(b.id)}','${esc47(r.id)}')">↩ Répondre</button>`);
 return `<article class="card" style="margin-top:9px"><div class="row between" style="gap:8px;align-items:flex-start"><div>${verified}<div style="font-size:20px;color:#d08a00;margin-top:5px" aria-label="${r.rating} sur 5">${stars(r.rating)}</div><b>${esc47(r.author_name||'Membre Issoire Connect')}</b></div><span class="muted">${esc47(fmt47(r.created_at))}</span></div>${r.comment?`<p style="white-space:pre-wrap">${esc47(r.comment)}</p>`:'<p class="muted">Aucun commentaire.</p>'}${reply}${actions.length?`<div class="actions" style="margin-top:9px;flex-wrap:wrap">${actions.join('')}</div>`:''}</article>`;
}

async function renderReviews(id,host){
 let b=businessById(id);if(!b)b=await loadBusiness(id);
 if(!b||!host)return;
 host.innerHTML='<div class="empty">Chargement des avis…</div>';
 try{
   const {summary,reviews}=await reviewData(id);
   const count=Number(summary?.review_count||0), avg=Number(summary?.average_rating||0), verified=Number(summary?.verified_count||0), reco=Number(summary?.recommendation_percent||0);
   const user=S.session?.user?.id||null,isOwner=!!user&&String(b.owner_id||'')===String(user);
   const my=reviews.find(r=>r.is_mine===true);
   let action='';
   if(!user)action='<button class="btn brand" onclick="closeModal();go(\'account\');setTimeout(()=>typeof say===\'function\'&&say(\'Connectez-vous pour publier un avis.\'),150)">⭐ Donner mon avis</button>';
   else if(!isOwner)action=`<button class="btn brand" onclick="openIc47ReviewForm('${esc47(id)}')">⭐ ${my?'Modifier mon avis':'Donner mon avis'}</button>`;
   host.innerHTML=`<div class="sectionhead" style="margin-bottom:8px"><div><span class="pill">⭐ AVIS & RECOMMANDATIONS</span><h3 style="margin:7px 0 2px">${count?`${avg.toFixed(1)} / 5`:'Aucun avis pour le moment'}</h3>${count?`<div style="font-size:22px;color:#d08a00">${stars(avg)}</div><div class="muted">${count} avis · ${verified} vérifié(s) · ${reco}% recommandent ce professionnel</div>`:'<div class="muted">Soyez le premier membre à partager une expérience utile.</div>'}</div>${action?`<div>${action}</div>`:''}</div><div class="notice"><b>✅ Avis vérifié</b> signifie qu’Issoire Connect a trouvé une commande ou réservation terminée entre ce membre et cette entreprise. Un simple message ou une visite de fiche ne suffit pas.</div>${reviews.length?reviews.map(r=>reviewCard(b,r,isOwner)).join(''):'<div class="empty">Pas encore d’avis publié.</div>'}`;
 }catch(err){host.innerHTML=`<div class="notice">Impossible de charger les avis : ${esc47(err?.message||err)}</div>`}
}

async function mountReviews(id,attempt=0){
 if(attempt>30)return;
 const body=modalEl();let b=businessById(id);
 if(!b){try{b=await loadBusiness(id)}catch{}}
 if(!body||!b||!String(body.textContent||'').toLowerCase().includes(String(b.name||'').toLowerCase()))return setTimeout(()=>mountReviews(id,attempt+1),120);
 let host=$('ic47ReviewSection');if(!host){host=document.createElement('section');host.id='ic47ReviewSection';host.className='card';host.style.marginTop='14px';body.appendChild(host)}
 return renderReviews(id,host);
}

const oldViewBusiness=window.viewBusiness;
if(typeof oldViewBusiness==='function')window.viewBusiness=function(id,...args){const r=oldViewBusiness.call(this,id,...args);setTimeout(()=>mountReviews(id),80);return r};

window.openIc47ReviewForm=async function(id){
 if(!S.session)return typeof say==='function'?say('Connectez-vous pour publier un avis.'):null;
 let existing=null;try{existing=(await reviewData(id)).reviews.find(r=>r.is_mine===true)||null}catch{}
 const rating=Number(existing?.rating||5),comment=existing?.comment||'';
 openModal(`<h2>⭐ ${existing?'Modifier mon avis':'Donner mon avis'}</h2><div class="notice">Votre avis aide les habitants à choisir. Le badge « vérifié » est attribué automatiquement uniquement après une commande ou réservation terminée.</div><div class="form"><label>Note</label><select id="ic47ReviewRating">${[5,4,3,2,1].map(n=>`<option value="${n}" ${n===rating?'selected':''}>${n}/5 — ${stars(n)}</option>`).join('')}</select><label>Commentaire</label><textarea id="ic47ReviewComment" rows="6" maxlength="2000" placeholder="Décrivez votre expérience…">${esc47(comment)}</textarea><div class="actions"><button class="btn brand" onclick="saveIc47Review('${esc47(id)}')">💾 Publier</button><button class="btn" onclick="closeModal();viewBusiness('${esc47(id)}')">Annuler</button></div></div>`);
};

window.saveIc47Review=async function(id){
 const rating=Number($('ic47ReviewRating')?.value||0),comment=$('ic47ReviewComment')?.value.trim()||null;
 if(rating<1||rating>5)return say('Choisissez une note de 1 à 5.');
 const {error}=await sb.rpc('ic_submit_review',{p_business:id,p_rating:rating,p_comment:comment});
 if(error)return say(error.message);
 closeModal();say('Avis publié. Merci !');setTimeout(()=>viewBusiness(id),80);
};

window.deleteIc47Review=async function(id,reviewId){
 if(!confirm('Supprimer votre avis ?'))return;
 const {error}=await sb.rpc('ic_delete_my_review',{p_review:reviewId});if(error)return say(error.message);
 say('Avis supprimé.');setTimeout(()=>viewBusiness(id),60);
};

window.openIc47ReviewReply=async function(id,reviewId){
 openModal(`<h2>↩ Répondre à l’avis</h2><div class="form"><label>Réponse du professionnel</label><textarea id="ic47ReviewReply" rows="6" maxlength="2000" placeholder="Répondez de manière professionnelle et utile."></textarea><div class="actions"><button class="btn brand" onclick="saveIc47ReviewReply('${esc47(id)}','${esc47(reviewId)}')">Publier la réponse</button><button class="btn" onclick="closeModal();viewBusiness('${esc47(id)}')">Annuler</button></div></div>`);
};

window.saveIc47ReviewReply=async function(id,reviewId){
 const reply=$('ic47ReviewReply')?.value.trim()||'';if(!reply)return say('Écrivez une réponse.');
 const {error}=await sb.rpc('ic_reply_to_review',{p_review:reviewId,p_reply:reply});if(error)return say(error.message);
 closeModal();say('Réponse publiée.');setTimeout(()=>viewBusiness(id),80);
};

function contextLabel(c){return c.business_name?`🏪 ${c.business_name}`:c.classified_title?`📣 ${c.classified_title}`:'💬 Conversation';}
function convKey(c){return `${c.other_user_id}|${c.business_id||''}|${c.classified_id||''}`}

async function getConversations(){
 const {data,error}=await sb.rpc('ic_get_my_conversations');if(error)throw error;C.conversations=data||[];return C.conversations;
}

async function refreshUnread(){
 const fab=$('ic47MessagesFab');
 if(!S.session){fab?.remove();return 0}
 try{
   const rows=await getConversations();const n=rows.reduce((s,c)=>s+Number(c.unread_count||0),0);
   ensureMessagesFab(n);const badge=$('ic47MessagesBadge');if(badge)badge.textContent=n>99?'99+':String(n);
   return n;
 }catch{return 0}
}

function ensureMessagesFab(unread=0){
 if(!S.session)return $('ic47MessagesFab')?.remove();
 let b=$('ic47MessagesFab');if(!b){
   b=document.createElement('button');b.id='ic47MessagesFab';b.type='button';b.onclick=()=>openIcMessagesV47();b.title='Mes conversations Issoire Connect';b.innerHTML='💬 <span>Messages</span> <span id="ic47MessagesBadge"></span>';
   b.style.cssText='position:fixed;left:14px;bottom:78px;z-index:2147482500;border:0;border-radius:999px;padding:10px 14px;background:#123d73;color:#fff;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.22);cursor:pointer';document.body.appendChild(b);
 }
 const badge=$('ic47MessagesBadge');if(badge){badge.style.cssText='display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 4px;border-radius:999px;background:#fff;color:#123d73;font-size:12px;margin-left:3px';badge.textContent=unread>99?'99+':String(unread);badge.style.visibility=unread?'visible':'hidden'}
}

function injectAccountCard(){
 if(!S.session)return;
 const m=mainEl();if(!m||$('ic47AccountMessages'))return;
 const card=document.createElement('section');card.id='ic47AccountMessages';card.className='card';card.style.margin='12px 0';
 card.innerHTML='<div class="row between" style="gap:10px"><div><span class="pill">💬 V47</span><h3 style="margin:6px 0 2px">Mes conversations</h3><div class="muted">Messages avec les professionnels et les membres, regroupés par discussion.</div></div><button class="btn brand" onclick="openIcMessagesV47()">Ouvrir mes messages</button></div>';
 m.prepend(card);
}

window.openIcMessagesV47=async function(){
 if(!S.session){if(typeof go==='function')go('account');return say('Connectez-vous pour accéder à vos messages.');}
 const m=mainEl();if(!m)return;
 C.route='messages';m.innerHTML='<div class="sectionhead"><div><span class="pill">💬 MESSAGERIE</span><h2>Mes conversations</h2><p>Historique regroupé par interlocuteur et par contexte.</p></div><div class="actions"><button class="btn" onclick="go(\'account\')">← Mon compte</button><button class="btn" onclick="openIcMessagesV47()">↻ Actualiser</button></div></div><div id="ic47ConversationList" class="empty">Chargement…</div>';
 try{
   const rows=await getConversations();
   const host=$('ic47ConversationList');if(!host)return;
   if(!rows.length){host.className='empty';host.textContent='Aucune conversation pour le moment.';ensureMessagesFab(0);return}
   host.className='cards';host.innerHTML=rows.map(c=>`<article class="card" style="cursor:pointer" onclick="openIc47Conversation(${uuidArg(c.other_user_id)},${uuidArg(c.business_id)},${uuidArg(c.classified_id)})"><div class="row between" style="gap:10px;align-items:flex-start"><div><span class="pill">${esc47(contextLabel(c))}</span><h3 style="margin:7px 0 3px">${esc47(c.other_name||'Utilisateur Issoire Connect')}</h3><div>${esc47(String(c.last_body||'').slice(0,150))}</div><div class="muted" style="margin-top:5px">${Number(c.message_count||0)} message(s) · ${esc47(fmt47(c.last_at))}</div></div>${Number(c.unread_count||0)>0?`<span class="pill">🔵 ${Number(c.unread_count)} non lu(s)</span>`:''}</div></article>`).join('');
   ensureMessagesFab(rows.reduce((s,c)=>s+Number(c.unread_count||0),0));
 }catch(err){$('ic47ConversationList').innerHTML=`<div class="notice">${esc47(err?.message||err)}</div>`}
};

window.openIc47Conversation=async function(other,business=null,classified=null){
 if(!S.session)return say('Connectez-vous pour accéder à vos messages.');
 const m=mainEl();if(!m)return;C.route='thread';
 const conv=C.conversations.find(c=>String(c.other_user_id)===String(other)&&String(c.business_id||'')===String(business||'')&&String(c.classified_id||'')===String(classified||''));
 m.innerHTML=`<div class="sectionhead"><div><span class="pill">${esc47(contextLabel(conv||{}))}</span><h2>${esc47(conv?.other_name||'Conversation')}</h2></div><div class="actions"><button class="btn" onclick="openIcMessagesV47()">← Conversations</button><button class="btn" onclick="openIc47Conversation(${uuidArg(other)},${uuidArg(business)},${uuidArg(classified)})">↻</button></div></div><div id="ic47Thread" class="card"><div class="empty">Chargement…</div></div>`;
 try{
   await sb.rpc('ic_mark_conversation_read',{p_other:other,p_business:business||null,p_classified:classified||null});
   const {data,error}=await sb.rpc('ic_get_conversation_messages',{p_other:other,p_business:business||null,p_classified:classified||null,p_limit:150,p_before:null});if(error)throw error;
   const rows=data||[],last=rows.at(-1)?.message_id||null;C.current={other,business:business||null,classified:classified||null,lastMessageId:last};
   const host=$('ic47Thread');if(!host)return;
   host.innerHTML=`<div style="display:flex;flex-direction:column;gap:8px;max-height:55vh;overflow:auto;padding:4px" id="ic47ThreadScroll">${rows.map(x=>`<div style="align-self:${x.is_mine?'flex-end':'flex-start'};max-width:82%;padding:9px 11px;border-radius:14px;background:${x.is_mine?'#e8f1ff':'#f2f4f7'}"><div style="white-space:pre-wrap">${esc47(x.body)}</div><div class="muted" style="font-size:11px;margin-top:4px">${esc47(fmt47(x.created_at))}${x.is_mine&&x.read_at?' · lu':''}</div></div>`).join('')||'<div class="empty">Aucun message.</div>'}</div><div class="form" style="margin-top:10px"><label>Répondre</label><textarea id="ic47ThreadReply" rows="3" maxlength="2000" placeholder="Votre message…"></textarea><div class="actions"><button class="btn brand" onclick="sendIc47ConversationMessage()">Envoyer</button></div></div>`;
   setTimeout(()=>{const sc=$('ic47ThreadScroll');if(sc)sc.scrollTop=sc.scrollHeight},30);refreshUnread();
 }catch(err){$('ic47Thread').innerHTML=`<div class="notice">${esc47(err?.message||err)}</div>`}
};

window.sendIc47ConversationMessage=async function(){
 const body=$('ic47ThreadReply')?.value.trim()||'';if(!body)return say('Écrivez un message.');
 if(!C.current?.lastMessageId)return say('Conversation introuvable.');
 const {error}=await sb.rpc('ic_reply_message',{p_message_id:C.current.lastMessageId,p_body:body});if(error)return say(error.message);
 await openIc47Conversation(C.current.other,C.current.business,C.current.classified);
};

const oldGo=window.go;
if(typeof oldGo==='function')window.go=function(page,...args){C.route=String(page||'');const r=oldGo.call(this,page,...args);setTimeout(()=>{if(C.route==='account')injectAccountCard();ensureMessagesFab(0);refreshUnread()},140);return r};

try{sb.auth.onAuthStateChange(()=>setTimeout(()=>{ensureMessagesFab(0);refreshUnread();if(C.route==='account')injectAccountCard()},220))}catch{}
setTimeout(()=>{ensureMessagesFab(0);refreshUnread()},700);
C.timer=setInterval(()=>{if(S.session)refreshUnread()},45000);

window.icV47={version:V,mountReviews,reviewData,refreshUnread,openMessages:window.openIcMessagesV47};
})();


;/* ===== business-modal-v47-fix.js ===== */
(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const previous=window.viewBusiness;
if(typeof previous!=='function')return;

function publicBusiness(id){return (S.businesses||[]).find(b=>String(b?.id)===String(id))||null}
function myBusiness(id){return (S.myBusinesses||[]).find(b=>String(b?.id)===String(id))||null}
function mergePublic(b){
 if(!b?.id)return null;
 S.businesses=S.businesses||[];
 const i=S.businesses.findIndex(x=>String(x?.id)===String(b.id));
 if(i>=0){Object.assign(S.businesses[i],b);return S.businesses[i]}
 S.businesses.push({...b});return S.businesses.at(-1);
}
async function ensureBusiness(id){
 let b=publicBusiness(id);if(b)return b;
 b=myBusiness(id);if(b)return mergePublic(b);
 try{
   if(typeof window.icV46LoadBusinessAuthority==='function'){
     const fresh=await window.icV46LoadBusinessAuthority(id);
     if(fresh)return mergePublic(fresh);
   }
 }catch{}
 try{
   const {data,error}=await sb.from('ic_businesses').select('*').eq('id',id).maybeSingle();
   if(error)throw error;
   return data?mergePublic(data):null;
 }catch{return null}
}

window.viewBusiness=function(id,...args){
 const self=this;
 const open=()=>{
   const b=publicBusiness(id);if(!b){if(typeof say==='function')say('Établissement introuvable.');return null}
   const r=previous.call(self,id,...args);
   setTimeout(()=>{
     const modal=document.getElementById('modal'),body=document.getElementById('modalBody');
     if(modal&&body&&modal.classList.contains('hidden')&&String(body.textContent||'').toLowerCase().includes(String(b.name||'').toLowerCase()))modal.classList.remove('hidden');
   },60);
   return r;
 };
 if(publicBusiness(id))return open();
 return ensureBusiness(id).then(b=>b?open():(typeof say==='function'?say('Établissement introuvable.'):null));
};

window.icV47BusinessModalFix={version:'47.0',ensureBusiness};
})();

