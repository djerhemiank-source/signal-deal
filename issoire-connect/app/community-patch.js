(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
S.privateMessages=S.privateMessages||[];
const _loadPrivateCommunity=loadPrivate;
const _classifiedCardCommunity=typeof classifiedCard==='function'?classifiedCard:null;
const _businessCardCommunity=businessCard;
const _viewBusinessCommunity=viewBusiness;
const _accountPageCommunity=accountPage;
const kinds=[['vente','Vente'],['don','Don'],['echange','Échange'],['recherche','Recherche'],['service','Service'],['immobilier','Immobilier']];
const uid=()=>S.session?.user?.id||null;
const ownClassified=c=>!!(c&&uid()&&c.user_id===uid());
const contextTitle=m=>m.classified_id?((S.classifieds||[]).find(c=>c.id===m.classified_id)?.title||'Petite annonce'):((S.businesses||[]).find(b=>b.id===m.business_id)?.name||'Commerce');

loadPrivate=async function(){
 await _loadPrivateCommunity();
 if(!S.session){S.privateMessages=[];return}
 const {data,error}=await sb.rpc('ic_get_my_messages');
 S.privateMessages=error?[]:(data||[]);
};

function classifiedActions(c){
 if(!c?.id)return '';
 if(ownClassified(c))return `<div class="actions" style="margin-top:8px"><button class="btn brand" onclick="event.stopPropagation();openEditClassified('${E(c.id)}')">✏️ Gérer mon annonce</button></div>`;
 return `<div class="actions" style="margin-top:8px"><button class="btn brand" onclick="event.stopPropagation();openClassifiedMessage('${E(c.id)}')">💬 Contacter</button></div>`;
}
if(_classifiedCardCommunity){classifiedCard=function(c){let h=_classifiedCardCommunity(c);if(!h.includes('openClassifiedMessage')&&!h.includes('openEditClassified'))h=h.replace('</article>',`${classifiedActions(c)}</article>`);return h}}

businessCard=function(b){let h=_businessCardCommunity(b);if(b?.owner_id&&b.owner_id!==uid()&&!h.includes('openBusinessMessage'))h=h.replace('</article>',`<div class="actions" style="margin-top:8px"><button class="btn" onclick="event.stopPropagation();openBusinessMessage('${E(b.id)}')">💬 Contacter</button></div></article>`);return h};
viewBusiness=function(id){_viewBusinessCommunity(id);const b=(S.businesses||[]).find(x=>x.id===id);if(!b||!modalBody||!b.owner_id||b.owner_id===uid())return;if(!modalBody.innerHTML.includes('openBusinessMessage'))modalBody.insertAdjacentHTML('beforeend',`<div class="actions" style="margin-top:12px"><button class="btn brand" onclick="openBusinessMessage('${E(id)}')">💬 Contacter ce professionnel</button></div>`)};

window.openCreateClassified=function(){
 if(!S.session){say('Connectez-vous pour publier une petite annonce.');authModal('classifieds');return}
 const options=kinds.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
 openModal(`<h2>📌 Publier une petite annonce</h2><div class="form"><label>Type</label><select id="ccKind">${options}</select><label>Titre</label><input id="ccTitle" maxlength="120" placeholder="Ex. Vélo de ville"><label>Description</label><textarea id="ccDescription" rows="6" maxlength="3000"></textarea><div class="two"><div><label>Prix en € (facultatif)</label><input id="ccPrice" type="number" min="0" step="0.01"></div><div><label>Précision prix</label><input id="ccPriceLabel" maxlength="80" placeholder="À débattre, gratuit…"></div></div><label>Ville</label><input id="ccCity" value="${E(S.profile?.city||'Issoire')}"><button class="btn brand" onclick="saveNewClassified()">Publier l’annonce</button></div>`)
};
window.saveNewClassified=async function(){
 if(!S.session)return;const title=$('#ccTitle')?.value.trim(),description=$('#ccDescription')?.value.trim()||null;if(!title)return say('Le titre est obligatoire.');
 const raw=$('#ccPrice')?.value;const payload={user_id:uid(),kind:$('#ccKind').value,title,description,price:raw===''?null:Number(raw),price_label:$('#ccPriceLabel')?.value.trim()||null,city:$('#ccCity')?.value.trim()||S.profile?.city||'Issoire',is_active:true};
 const {data,error}=await sb.from('ic_classifieds').insert(payload).select('*').single();if(error)return say(error.message);S.classifieds=[data,...(S.classifieds||[])];closeModal();say('Annonce publiée.');go('classifieds')
};
window.openEditClassified=function(id){
 const c=(S.classifieds||[]).find(x=>x.id===id);if(!ownClassified(c))return say('Vous ne pouvez modifier que vos propres annonces.');
 const options=kinds.map(([v,l])=>`<option value="${v}" ${c.kind===v?'selected':''}>${l}</option>`).join('');
 openModal(`<h2>✏️ Gérer mon annonce</h2><div class="form"><label>Type</label><select id="ecKind">${options}</select><label>Titre</label><input id="ecTitle" maxlength="120" value="${E(c.title)}"><label>Description</label><textarea id="ecDescription" rows="6" maxlength="3000">${E(c.description||'')}</textarea><div class="two"><div><label>Prix en €</label><input id="ecPrice" type="number" min="0" step="0.01" value="${c.price??''}"></div><div><label>Précision prix</label><input id="ecPriceLabel" maxlength="80" value="${E(c.price_label||'')}"></div></div><label>Ville</label><input id="ecCity" value="${E(c.city||'Issoire')}"><label><input id="ecActive" type="checkbox" ${c.is_active?'checked':''}> Annonce active et visible</label><div class="actions"><button class="btn brand" onclick="saveClassified('${E(id)}')">💾 Enregistrer</button><button class="btn" onclick="deleteClassified('${E(id)}')">🗑 Supprimer</button></div></div>`)
};
window.saveClassified=async function(id){const c=(S.classifieds||[]).find(x=>x.id===id);if(!ownClassified(c))return say('Accès refusé.');const title=$('#ecTitle')?.value.trim();if(!title)return say('Le titre est obligatoire.');const raw=$('#ecPrice')?.value;const payload={kind:$('#ecKind').value,title,description:$('#ecDescription')?.value.trim()||null,price:raw===''?null:Number(raw),price_label:$('#ecPriceLabel')?.value.trim()||null,city:$('#ecCity')?.value.trim()||'Issoire',is_active:$('#ecActive').checked};const {data,error}=await sb.from('ic_classifieds').update(payload).eq('id',id).eq('user_id',uid()).select('*').single();if(error)return say(error.message);S.classifieds=(S.classifieds||[]).map(x=>x.id===id?data:x);closeModal();say('Annonce mise à jour.');go('classifieds')};
window.deleteClassified=async function(id){const c=(S.classifieds||[]).find(x=>x.id===id);if(!ownClassified(c))return say('Accès refusé.');if(!confirm('Supprimer définitivement cette annonce ?'))return;const {error}=await sb.from('ic_classifieds').delete().eq('id',id).eq('user_id',uid());if(error)return say(error.message);S.classifieds=(S.classifieds||[]).filter(x=>x.id!==id);closeModal();say('Annonce supprimée.');go('classifieds')};

function compose(contextType,contextId,recipientId,title){
 if(!S.session){say('Connectez-vous pour envoyer un message.');authModal(contextType==='classified'?'classifieds':'businesses');return}
 if(!recipientId)return say('Ce contact n’est pas disponible.');if(recipientId===uid())return say('Vous ne pouvez pas vous envoyer un message à vous-même.');
 openModal(`<h2>💬 ${E(title)}</h2><p class="muted">Messages privés entre les participants de cette conversation.</p><div class="form"><textarea id="cmBody" rows="6" maxlength="2000" placeholder="Votre message…"></textarea><button class="btn brand" onclick="sendContextMessage('${E(contextType)}','${E(contextId)}','${E(recipientId)}')">Envoyer</button></div>`)
}
window.openClassifiedMessage=function(id){const c=(S.classifieds||[]).find(x=>x.id===id);if(!c)return say('Annonce introuvable.');if(ownClassified(c))return openEditClassified(id);compose('classified',id,c.user_id,`Contacter pour « ${c.title} »`)};
window.openBusinessMessage=function(id){const b=(S.businesses||[]).find(x=>x.id===id);if(!b)return say('Commerce introuvable.');if(!b.owner_id)return say('Cette fiche n’a pas encore de contact professionnel vérifié.');compose('business',id,b.owner_id,`Contacter ${b.name}`)};
window.sendContextMessage=async function(type,contextId,recipientId){if(!S.session)return;const body=$('#cmBody')?.value.trim();if(!body)return say('Écrivez un message.');const payload={sender_id:uid(),recipient_id:recipientId,body,business_id:type==='business'?contextId:null,classified_id:type==='classified'?contextId:null};const {error}=await sb.from('ic_messages').insert(payload);if(error)return say(error.message);closeModal();say('Message envoyé.');await loadPrivate();openMessageThread(type,contextId,recipientId)};

window.openMessageThread=async function(type,contextId,otherId){
 if(!S.session)return authModal('account');const list=(S.privateMessages||[]).filter(m=>(type==='classified'?m.classified_id===contextId:m.business_id===contextId)&&(m.sender_id===otherId||m.recipient_id===otherId)).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
 const unread=list.filter(m=>m.recipient_id===uid()&&!m.read_at).map(m=>m.message_id);if(unread.length){await sb.from('ic_messages').update({read_at:new Date().toISOString()}).in('id',unread);S.privateMessages=S.privateMessages.map(m=>unread.includes(m.message_id)?{...m,read_at:new Date().toISOString()}:m)}
 const title=list.length?contextTitle(list[0]):(type==='classified'?'Petite annonce':'Commerce');const bubbles=list.map(m=>`<div class="notice" style="margin:8px 0;${m.sender_id===uid()?'margin-left:28px':'margin-right:28px'}"><b>${E(m.sender_id===uid()?'Vous':m.sender_name)}</b><p>${E(m.body)}</p><div class="muted">${new Date(m.created_at).toLocaleString('fr-FR')}</div></div>`).join('');
 openModal(`<h2>💬 ${E(title)}</h2><div style="max-height:50vh;overflow:auto">${bubbles||'<div class="empty">Aucun message.</div>'}</div><div class="form" style="margin-top:12px"><textarea id="cmBody" rows="3" maxlength="2000" placeholder="Répondre…"></textarea><button class="btn brand" onclick="sendContextMessage('${E(type)}','${E(contextId)}','${E(otherId)}')">Envoyer</button></div>`)
};

function conversationsSection(){
 const map=new Map();for(const m of S.privateMessages||[]){const type=m.classified_id?'classified':'business',contextId=m.classified_id||m.business_id,otherId=m.sender_id===uid()?m.recipient_id:m.sender_id,key=`${type}:${contextId}:${otherId}`;if(!map.has(key))map.set(key,{type,contextId,otherId,last:m,unread:0});const v=map.get(key);if(new Date(m.created_at)>new Date(v.last.created_at))v.last=m;if(m.recipient_id===uid()&&!m.read_at)v.unread++}
 const rows=[...map.values()].sort((a,b)=>new Date(b.last.created_at)-new Date(a.last.created_at));return `<div class="sectionhead"><div><h2>💬 Mes messages</h2><p>Conversations liées aux commerces et petites annonces.</p></div><span class="pill">${rows.reduce((n,x)=>n+x.unread,0)} non lu(s)</span></div>${rows.length?`<div class="cards">${rows.map(x=>`<article class="card" onclick="openMessageThread('${x.type}','${E(x.contextId)}','${E(x.otherId)}')"><div class="row between"><h3>${E(contextTitle(x.last))}</h3>${x.unread?`<span class="pill">${x.unread} nouveau${x.unread>1?'x':''}</span>`:''}</div><p>${E(x.last.body)}</p><div class="muted">${new Date(x.last.created_at).toLocaleString('fr-FR')}</div></article>`).join('')}</div>`:'<div class="empty">Aucune conversation pour le moment.</div>'}`
}
function myClassifiedsSection(){const rows=(S.classifieds||[]).filter(ownClassified);return `<div class="sectionhead"><div><h2>📌 Mes petites annonces</h2><p>Publiez et gérez vos annonces locales.</p></div><button class="btn brand" onclick="openCreateClassified()">+ Publier</button></div>${rows.length?`<div class="cards">${rows.map(c=>`<article class="card"><span class="pill">${E(c.kind)}</span><h3>${E(c.title)}</h3><div class="muted">${c.is_active?'Visible':'Archivée'} · ${E(c.city)}</div><button class="btn" style="margin-top:8px" onclick="openEditClassified('${E(c.id)}')">Gérer</button></article>`).join('')}</div>`:'<div class="empty">Vous n’avez publié aucune petite annonce.</div>'}`}
accountPage=function(){const out=_accountPageCommunity();if(!S.session||S.profile?.role==='admin')return out;try{main.insertAdjacentHTML('beforeend',myClassifiedsSection()+conversationsSection())}catch(e){console.error('Issoire Connect community account render',e)}return out};
})();
