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
