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
