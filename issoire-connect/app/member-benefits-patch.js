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