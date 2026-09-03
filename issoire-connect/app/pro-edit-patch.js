(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const _proAccount2=proAccount,_viewBusiness2=viewBusiness,_businessCard2=businessCard;
const DAYS=[['mon','Lundi'],['tue','Mardi'],['wed','Mercredi'],['thu','Jeudi'],['fri','Vendredi'],['sat','Samedi'],['sun','Dimanche']];
const RADII=[1,5,10,20,50];
const ownedBusiness=id=>(S.myBusinesses||[]).find(b=>b.id===id&&S.session&&b.owner_id===S.session.user.id);
const safeUrl=v=>{let s=(v||'').trim();if(!s)return null;if(!/^https?:\/\//i.test(s))s='https://'+s;return s};
const audLabel=v=>v==='individuals'?'Particuliers':v==='professionals'?'Professionnels':'Particuliers + professionnels';
const modeLabel=v=>v==='mobile'?'Professionnel mobile':v==='both'?'Établissement + interventions':'Établissement';
function publicArea(b){const r=Number(b?.visibility_radius_km||20);return b?.service_area_label||`Basé à ${b?.city||'Issoire'} — intervient jusqu’à ${r} km`}
function hoursLines(b){const h=b?.opening_hours||{};const rows=DAYS.filter(([k])=>h[k]).map(([k,l])=>`<div class="row between"><span>${l}</span><b>${esc(h[k])}</b></div>`);return rows.length?`<div class="notice" style="margin-top:12px"><b>🕒 Horaires</b><div style="display:grid;gap:5px;margin-top:8px">${rows.join('')}</div></div>`:''}
function verifiedBadge(b){return b?.is_claimed?'<span class="pill" style="margin-left:5px">✓ Fiche vérifiée</span>':''}
function completeness(b){const checks=[b.name,b.category,b.description,b.phone,b.contact_email,b.website,b.logo_url,b.city,b.postal_code,b.service_area_label||b.address,Object.keys(b.opening_hours||{}).length,b.customer_audience];const n=checks.filter(Boolean).length;return Math.round(n/checks.length*100)}
function missingFields(b){const m=[];if(!b.description)m.push('description');if(!b.phone)m.push('téléphone');if(!b.contact_email)m.push('email');if(!b.logo_url)m.push('logo');if(!b.service_area_label&&!b.address)m.push('zone/adresse');if(!Object.keys(b.opening_hours||{}).length)m.push('horaires');return m.slice(0,4)}
function socials(b){const x=[];if(b.facebook_url)x.push(`<a class="btn" target="_blank" rel="noopener" href="${esc(b.facebook_url)}">Facebook</a>`);if(b.instagram_url)x.push(`<a class="btn" target="_blank" rel="noopener" href="${esc(b.instagram_url)}">Instagram</a>`);if(b.linkedin_url)x.push(`<a class="btn" target="_blank" rel="noopener" href="${esc(b.linkedin_url)}">LinkedIn</a>`);return x.length?`<div class="actions" style="margin-top:10px">${x.join('')}</div>`:''}

businessCard=function(b){let h=_businessCard2(b);if(b?.is_claimed)h=h.replace('</h3>',` ${verifiedBadge(b)}</h3>`);if(b?.tagline)h=h.replace('</h3>',`</h3><div class="muted" style="margin-top:4px">${esc(b.tagline)}</div>`);return h};

viewBusiness=function(id){_viewBusiness2(id);const b=(S.businesses||[]).find(x=>x.id===id)||(S.myBusinesses||[]).find(x=>x.id===id);if(!b||typeof modalBody==='undefined'||!modalBody)return;
  const identity=[];
  if(b.legal_name&&b.legal_name!==b.name)identity.push(`<div><b>Raison sociale :</b> ${esc(b.legal_name)}</div>`);
  if(b.siret)identity.push(`<div><b>SIRET :</b> ${esc(b.siret)}</div>`);
  if(b.customer_audience)identity.push(`<div><b>Clientèle :</b> ${esc(audLabel(b.customer_audience))}</div>`);
  if(identity.length)modalBody.insertAdjacentHTML('beforeend',`<div class="notice" style="margin-top:12px">${identity.join('')}</div>`);
  modalBody.insertAdjacentHTML('beforeend',hoursLines(b));
  if(b.booking_url)modalBody.insertAdjacentHTML('beforeend',`<div class="actions" style="margin-top:10px"><a class="btn brand" target="_blank" rel="noopener" href="${esc(b.booking_url)}">📅 Réserver / prendre rendez-vous</a></div>`);
  modalBody.insertAdjacentHTML('beforeend',socials(b));
  if(ownedBusiness(id))modalBody.insertAdjacentHTML('beforeend',`<div class="actions" style="margin-top:12px"><button class="btn brand" onclick="openEditBusiness('${id}')">✏️ Modifier toutes les infos de mon entreprise</button></div>`)
};

window.openEditBusiness=function(id){const b=ownedBusiness(id);if(!b)return say('Vous ne pouvez modifier que votre propre fiche.');const h=b.opening_hours||{},lockedLegal=!!(b.siret&&(b.source==='sirene'||b.is_claimed));openModal(`
<h2>🏪 Ma fiche entreprise</h2>
<p class="muted">Complétez votre entreprise une seule fois : ces informations alimentent automatiquement votre fiche publique, l’annuaire et le Radar Issoire Connect.</p>
<div class="notice"><b>Complétion actuelle : ${completeness(b)} %</b>${missingFields(b).length?`<br><small>À compléter : ${missingFields(b).map(esc).join(', ')}.</small>`:'<br><small>Votre fiche est bien renseignée.</small>'}</div>
<div class="form">
<h3>1. Identité de l’entreprise</h3>
<label>Nom commercial *</label><input id="ebName" maxlength="160" value="${esc(b.name||'')}" placeholder="Ex. Chef Marco — cuisine à domicile">
<label>Raison sociale / nom légal</label><input id="ebLegal" maxlength="200" value="${esc(b.legal_name||'')}" placeholder="Ex. Jean Dupont EI">
<label>Slogan / phrase courte</label><input id="ebTagline" maxlength="180" value="${esc(b.tagline||'')}" placeholder="Ex. Votre chef à domicile pour vos soirées privées et professionnelles">
<div class="two"><div><label>Catégorie / activité principale *</label><input id="ebCategory" maxlength="120" value="${esc(b.category||'')}" placeholder="Ex. Chef à domicile"></div><div><label>Clientèle</label><select id="ebAudience"><option value="both" ${(!b.customer_audience||b.customer_audience==='both')?'selected':''}>Particuliers + professionnels</option><option value="individuals" ${b.customer_audience==='individuals'?'selected':''}>Particuliers</option><option value="professionals" ${b.customer_audience==='professionals'?'selected':''}>Professionnels</option></select></div></div>
<label>Description détaillée *</label><textarea id="ebDescription" maxlength="3000" rows="6" placeholder="Présentez votre activité, vos spécialités et ce qui vous différencie…">${esc(b.description||'')}</textarea>

<h3>2. Identité légale</h3>
${lockedLegal?`<div class="notice">🔒 <b>SIRET vérifié :</b> ${esc(b.siret)}${b.siren?` · SIREN ${esc(b.siren)}`:''}<br><small>Ces données proviennent d’une fiche SIRENE/revendiquée et ne sont pas modifiables depuis la fiche publique.</small></div>`:`<label>SIRET</label><input id="ebSiret" inputmode="numeric" maxlength="14" value="${esc(b.siret||'')}" placeholder="14 chiffres"><p class="muted">Si vous saisissez un SIRET, il pourra être contrôlé avant l’affichage d’un badge de vérification.</p>`}

<h3>3. Coordonnées</h3>
<label>Nom de la personne à contacter</label><input id="ebContactName" maxlength="160" value="${esc(b.contact_name||'')}" placeholder="Ex. Jean Dupont">
<div class="two"><div><label>Téléphone professionnel</label><input id="ebPhone" type="tel" maxlength="30" value="${esc(b.phone||'')}"></div><div><label>Email professionnel</label><input id="ebEmail" type="email" maxlength="220" value="${esc(b.contact_email||'')}"></div></div>
<label>Site internet</label><input id="ebWebsite" type="url" value="${esc(b.website||'')}" placeholder="https://...">
<label>Lien réservation / prise de rendez-vous</label><input id="ebBooking" type="url" value="${esc(b.booking_url||'')}" placeholder="https://...">

<h3>4. Localisation et zone d’intervention</h3>
<div class="two"><div><label>Mode d’activité</label><select id="ebMode"><option value="establishment" ${(!b.business_mode||b.business_mode==='establishment')?'selected':''}>Dans mon établissement</option><option value="mobile" ${b.business_mode==='mobile'?'selected':''}>Chez mes clients / mobile</option><option value="both" ${b.business_mode==='both'?'selected':''}>Établissement + chez mes clients</option></select></div><div><label>Rayon d’intervention</label><select id="ebRadius">${RADII.map(r=>`<option value="${r}" ${Number(b.visibility_radius_km||20)===r?'selected':''}>${r} km</option>`).join('')}</select></div></div>
<label>Adresse</label><input id="ebAddress" maxlength="250" value="${esc(b.address||'')}" placeholder="Adresse de l’établissement ou adresse administrative">
<div class="two"><div><label>Ville</label><input id="ebCity" maxlength="120" value="${esc(b.city||'Issoire')}"></div><div><label>Code postal</label><input id="ebPostal" maxlength="10" value="${esc(b.postal_code||'63500')}"></div></div>
<label>Texte public de zone</label><input id="ebArea" maxlength="180" value="${esc(b.service_area_label||publicArea(b))}" placeholder="Ex. Basé à Issoire — intervient jusqu’à 20 km">
<label style="display:flex;gap:8px;align-items:center"><input id="ebShowAddress" type="checkbox" ${b.show_public_address!==false?'checked':''}> Afficher mon adresse complète au public</label>
<div class="notice"><small>Si votre adresse correspond à votre domicile et que vous êtes professionnel mobile, décochez cette case.</small></div>

<h3>5. Visuels</h3>
<label>Logo — URL</label><input id="ebLogo" type="url" value="${esc(b.logo_url||'')}" placeholder="https://...">
<label>Photo de couverture — URL</label><input id="ebCover" type="url" value="${esc(b.cover_image_url||'')}" placeholder="https://...">

<h3>6. Réseaux sociaux</h3>
<label>Facebook</label><input id="ebFacebook" type="url" value="${esc(b.facebook_url||'')}" placeholder="https://facebook.com/..."><label>Instagram</label><input id="ebInstagram" type="url" value="${esc(b.instagram_url||'')}" placeholder="https://instagram.com/..."><label>LinkedIn</label><input id="ebLinkedin" type="url" value="${esc(b.linkedin_url||'')}" placeholder="https://linkedin.com/..."></div>

<h3>7. Horaires</h3>${DAYS.map(([k,l])=>`<label>${l}</label><input id="eh_${k}" maxlength="100" placeholder="09:00–12:00 / 14:00–18:00 ou Fermé" value="${esc(h[k]||'')}">`).join('')}
<button class="btn brand" onclick="saveBusinessProfile('${id}')">💾 Enregistrer ma fiche entreprise</button>
</div>`)};

window.saveBusinessProfile=async function(id){const b=ownedBusiness(id);if(!b)return say('Accès refusé.');const name=$('#ebName').value.trim(),category=$('#ebCategory').value.trim(),description=$('#ebDescription').value.trim();if(name.length<2)return say('Indiquez le nom de votre entreprise.');if(category.length<2)return say('Indiquez votre activité principale.');if(description.length<20)return say('Ajoutez une description un peu plus détaillée de votre activité.');const opening_hours={};for(const [k] of DAYS){const el=$(`#eh_${k}`);const v=el?el.value.trim():'';if(v)opening_hours[k]=v}const payload={
  name,legal_name:$('#ebLegal').value.trim()||null,tagline:$('#ebTagline').value.trim()||null,category,description,
  customer_audience:$('#ebAudience').value||'both',contact_name:$('#ebContactName').value.trim()||null,
  phone:$('#ebPhone').value.trim()||null,contact_email:$('#ebEmail').value.trim()||null,
  website:safeUrl($('#ebWebsite').value),booking_url:safeUrl($('#ebBooking').value),
  business_mode:$('#ebMode').value||'establishment',visibility_radius_km:Number($('#ebRadius').value||20),
  address:$('#ebAddress').value.trim()||null,city:$('#ebCity').value.trim()||'Issoire',postal_code:$('#ebPostal').value.trim()||null,
  service_area_label:$('#ebArea').value.trim()||null,show_public_address:!!$('#ebShowAddress').checked,
  logo_url:safeUrl($('#ebLogo').value),cover_image_url:safeUrl($('#ebCover').value),
  facebook_url:safeUrl($('#ebFacebook').value),instagram_url:safeUrl($('#ebInstagram').value),linkedin_url:safeUrl($('#ebLinkedin').value),
  opening_hours,updated_at:new Date().toISOString()
};
if(!b.siret||(!b.is_claimed&&b.source!=='sirene')){const siret=(document.getElementById('ebSiret')?.value||'').replace(/\s/g,'');if(siret&&(!/^\d{14}$/.test(siret)))return say('Le SIRET doit contenir 14 chiffres.');if(siret)payload.siret=siret}
const {data,error}=await sb.from('ic_businesses').update(payload).eq('id',id).eq('owner_id',S.session.user.id).select('*').single();if(error)return say(error.message);Object.assign(b,data);const pub=(S.businesses||[]).find(x=>x.id===id);if(pub)Object.assign(pub,data);closeModal();say('Fiche professionnelle mise à jour.');await refresh()};

proAccount=function(){_proAccount2();if(S.myBusinesses.length){main.insertAdjacentHTML('beforeend',`<div class="sectionhead"><div><h2>🏪 Mon établissement / mon entreprise</h2><p>Complétez toutes les informations qui seront visibles dans l’annuaire et le Radar.</p></div></div><div class="cards">${S.myBusinesses.map(b=>{const pct=completeness(b),miss=missingFields(b);return `<article class="card"><div class="row between"><div><h3>${esc(b.name)}</h3><span class="pill">${b.is_claimed?'✓ Vérifiée':'Fiche créée'}</span></div><button class="btn brand" onclick="openEditBusiness('${b.id}')">✏️ Remplir / modifier</button></div><div style="margin:10px 0"><div class="row between"><small>Fiche complétée</small><b>${pct} %</b></div><div style="height:8px;background:#e8eef5;border-radius:99px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#0877eb,#ff8318)"></div></div>${miss.length?`<small class="muted">À compléter : ${miss.map(esc).join(', ')}</small>`:'<small class="muted">Votre fiche est prête.</small>'}</div><div class="muted">${esc(modeLabel(b.business_mode))} · ${esc(publicArea(b))}</div>${b.phone?`<div>☎ ${esc(b.phone)}</div>`:''}${b.contact_email?`<div>✉ ${esc(b.contact_email)}</div>`:''}${b.website?`<div>🌐 ${esc(b.website)}</div>`:''}${hoursLines(b)}</article>`}).join('')}</div>`)} };
})();
