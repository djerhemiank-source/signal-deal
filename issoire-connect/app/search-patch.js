(()=>{
if(typeof S==='undefined')return;
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const match=(x,fields,q)=>norm(fields.map(k=>x?.[k]).join(' ')).includes(q);
const id=v=>String(v??'').replace(/'/g,"\\'");
function safeVisibleBusinesses(){
 try{const v=typeof visibleBusinesses==='function'?visibleBusinesses():null;if(Array.isArray(v))return v}catch(e){console.warn('visibleBusinesses fallback',e)}
 return arr(S.businesses);
}
function simpleCard(icon,type,title,sub,on=''){
 return `<article class="card" ${on?`onclick="${on}"`:''}><span class="pill">${icon} ${E(type)}</span><h3>${E(title)}</h3>${sub?`<div class="muted">${E(sub)}</div>`:''}</article>`;
}
function businessResult(b){
 try{if(typeof businessCard==='function')return businessCard(b)}catch(e){console.warn('businessCard fallback',e)}
 return simpleCard('🏪',b?.category||'Professionnel',b?.name||'Établissement',b?.address||b?.city||'Issoire',typeof viewBusiness==='function'?`viewBusiness('${id(b?.id)}')`:'' );
}
function productResult(x){
 try{if(typeof productCard==='function')return productCard(x)}catch(e){console.warn('productCard fallback',e)}
 return simpleCard('🛍️',x?.kind||'Produit',x?.name||'Produit',x?.description||'');
}
function offerResult(x){
 try{if(typeof offerCard==='function')return offerCard(x)}catch(e){console.warn('offerCard fallback',e)}
 return simpleCard('🔥',x?.offer_type||'Offre',x?.title||'Bon plan',x?.description||'');
}
function jobResult(x){
 try{if(typeof jobCard==='function')return jobCard(x)}catch(e){console.warn('jobCard fallback',e)}
 return simpleCard('💼',x?.contract_type||'Emploi',x?.title||'Offre d’emploi',x?.location||'Issoire');
}
function classifiedResult(x){
 try{if(typeof classifiedCard==='function')return classifiedCard(x)}catch(e){console.warn('classifiedCard fallback',e)}
 return simpleCard('📌',x?.kind||x?.category||'Annonce',x?.title||'Petite annonce',x?.city||'Issoire');
}
function eventResult(x){
 try{if(typeof eventCard==='function')return eventCard(x)}catch(e){console.warn('eventCard fallback',e)}
 return simpleCard('📅','Événement',x?.title||'Événement',x?.place||'Issoire');
}
window.runSearch=function(){
 const input=document.querySelector('#globalQ'),out=document.querySelector('#searchOut');
 if(!out)return;
 const raw=input?.value||'',q=norm(raw);
 if(!q){out.innerHTML='<div class="empty">Saisissez un commerce, un métier, un produit, un service ou un besoin.</div>';return}
 try{
  const bs=safeVisibleBusinesses().filter(x=>match(x,['name','category','description','search_keywords','address','city','postal_code','naf_code','siret'],q));
  const ps=arr(S.products).filter(x=>match(x,['name','description','kind'],q));
  const os=arr(S.offers).filter(x=>match(x,['title','description','offer_type'],q));
  const js=arr(S.jobs).filter(x=>match(x,['title','description','contract_type','location'],q));
  const cs=arr(S.classifieds).filter(x=>match(x,['title','description','kind','category','city'],q));
  const es=arr(S.events).filter(x=>match(x,['title','description','place'],q));
  const total=bs.length+ps.length+os.length+js.length+cs.length+es.length;
  const cards=[
   ...bs.slice(0,100).map(businessResult),
   ...ps.slice(0,30).map(productResult),
   ...os.slice(0,30).map(offerResult),
   ...js.slice(0,30).map(jobResult),
   ...cs.slice(0,30).map(classifiedResult),
   ...es.slice(0,30).map(eventResult)
  ].filter(Boolean);
  out.innerHTML=`<div class="notice"><b>🔎 ${total} résultat${total>1?'s':''} pour « ${E(raw)} »</b>${bs.length>100?'<div class="muted">Les 100 premiers établissements sont affichés. Affinez votre recherche pour en voir davantage.</div>':''}</div>${cards.length?`<div class="cards" style="margin-top:12px">${cards.join('')}</div>`:'<div class="empty">Aucun résultat. Essayez un métier comme boulangerie, garage, coiffeur, médecin ou assurance.</div>'}`;
 }catch(e){console.error('Issoire Connect search error',e);out.innerHTML='<div class="empty">La recherche a rencontré un problème. Réessayez ou changez de terme.</div>'}
};
document.addEventListener('input',e=>{if(e.target&&e.target.id==='globalQ')window.runSearch()});
document.addEventListener('keydown',e=>{if(e.target&&e.target.id==='globalQ'&&e.key==='Enter'){e.preventDefault();window.runSearch()}});
})();
