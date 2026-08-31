(()=>{
if(typeof go!=='function'||typeof renderDirectoryPage!=='function'||typeof main==='undefined')return;
const _legacyWrappedGo=go;
const _enhancedDirectory=renderDirectoryPage;
const _noopDirectory=()=>Promise.resolve();
let desired=null;
let initialTimer=null;
let recoveryTimer=null;
let rendering=false;
async function renderStable(page){
 if(desired!==page)return;
 window.renderDirectoryPage=_enhancedDirectory;
 rendering=true;
 try{await _enhancedDirectory(page==='nearby')}finally{rendering=false}
}
go=function(page,...args){
 const isDirectory=page==='businesses'||page==='nearby';
 if(!isDirectory){
   desired=null;
   clearTimeout(initialTimer);
   clearTimeout(recoveryTimer);
   window.renderDirectoryPage=_enhancedDirectory;
   return _legacyWrappedGo(page,...args);
 }
 desired=page;
 clearTimeout(initialTimer);
 clearTimeout(recoveryTimer);
 window.renderDirectoryPage=_noopDirectory;
 let result;
 try{result=_legacyWrappedGo(page,...args)}catch(err){window.renderDirectoryPage=_enhancedDirectory;throw err}
 initialTimer=setTimeout(()=>renderStable(page),650);
 return result;
};
const observer=new MutationObserver(()=>{
 if(!desired||rendering)return;
 if(document.getElementById('dirJob'))return;
 const text=(main.innerText||'').toLowerCase();
 if(text.includes('chargement de l’annuaire officiel'))return;
 clearTimeout(recoveryTimer);
 const page=desired;
 recoveryTimer=setTimeout(()=>{if(desired===page&&!document.getElementById('dirJob'))renderStable(page)},180);
});
observer.observe(main,{childList:true,subtree:true});
})();
