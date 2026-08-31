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
