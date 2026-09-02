(()=>{
if(typeof window.applyDirectoryFilters!=='function')return;
const state={job:'',distance:'',open:false};
function rememberFromDom(){const q=document.getElementById('dirJob'),d=document.getElementById('dirDistance'),o=document.getElementById('dirOpen');if(q)state.job=q.value;if(d)state.distance=d.value;if(o)state.open=!!o.checked}
function restoreToDom(){const q=document.getElementById('dirJob'),d=document.getElementById('dirDistance'),o=document.getElementById('dirOpen');if(q&&state.job&&q.value!==state.job)q.value=state.job;if(d&&state.distance&&d.value!==state.distance)d.value=state.distance;if(o&&state.open!==!!o.checked)o.checked=state.open}
document.addEventListener('input',ev=>{const t=ev.target;if(!(t instanceof HTMLElement))return;if(t.id==='dirJob')state.job=t.value;if(t.id==='dirDistance')state.distance=t.value;if(t.id==='dirOpen')state.open=!!t.checked},true);
document.addEventListener('change',ev=>{const t=ev.target;if(!(t instanceof HTMLElement))return;if(t.id==='dirJob')state.job=t.value;if(t.id==='dirDistance')state.distance=t.value;if(t.id==='dirOpen')state.open=!!t.checked},true);
const baseApply=window.applyDirectoryFilters;
window.applyDirectoryFilters=function(...args){const q=document.getElementById('dirJob'),d=document.getElementById('dirDistance'),o=document.getElementById('dirOpen');if(q&&state.job&&!q.value)q.value=state.job;if(d&&state.distance)d.value=state.distance;if(o)o.checked=state.open;rememberFromDom();return baseApply.apply(this,args)};
const observer=new MutationObserver(()=>{if(document.getElementById('dirJob'))restoreToDom()});
if(typeof main!=='undefined'&&main)observer.observe(main,{childList:true,subtree:true});
window.icDirectoryPersistentState=state;
})();