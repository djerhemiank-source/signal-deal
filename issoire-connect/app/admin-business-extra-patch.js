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
