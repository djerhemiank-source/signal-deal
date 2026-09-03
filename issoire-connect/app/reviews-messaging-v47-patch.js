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
