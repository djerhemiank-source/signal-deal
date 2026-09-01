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
