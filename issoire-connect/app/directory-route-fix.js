(()=>{
if(typeof go!=='function'||typeof renderDirectoryPage!=='function'||typeof main==='undefined')return;
const _wrappedGo=go;
const _enhancedDirectory=renderDirectoryPage;
const _noopDirectory=()=>Promise.resolve();
let desired=null;
let enhancedActive=false;
let settleTimer=null;
let fallbackTimer=null;
let rendering=false;
function clearTimers(){clearTimeout(settleTimer);clearTimeout(fallbackTimer);settleTimer=null;fallbackTimer=null}
function enhancedVisible(page=desired){
 const text=main?.innerText||'';
 return page==='nearby'?/Autour de moi/i.test(text):/Annuaire local d[’']Issoire/i.test(text);
}
async function renderStable(page){
 if(!page||desired!==page||rendering)return;
 clearTimers();
 enhancedActive=true;
 window.renderDirectoryPage=_enhancedDirectory;
 rendering=true;
 try{await _enhancedDirectory(page==='nearby')}finally{rendering=false}
}
function scheduleStable(page,delay=180){
 if(!page||desired!==page||enhancedActive)return;
 clearTimeout(settleTimer);
 settleTimer=setTimeout(()=>renderStable(page),delay);
}
go=function(page,...args){
 const isDirectory=page==='businesses'||page==='nearby';
 if(!isDirectory){
   desired=null;
   enhancedActive=false;
   clearTimers();
   window.renderDirectoryPage=_enhancedDirectory;
   return _wrappedGo(page,...args);
 }
 desired=page;
 enhancedActive=false;
 clearTimers();
 // directory-patch.js contient déjà un setTimeout(...,0) vers renderDirectoryPage.
 // On garde donc la fonction neutre jusqu'à ce que l'ancien écran ait réellement
 // terminé son rendu. Ainsi aucun annuaire V19 éphémère ne peut être réécrasé.
 window.renderDirectoryPage=_noopDirectory;
 let result;
 try{result=_wrappedGo(page,...args)}catch(err){window.renderDirectoryPage=_enhancedDirectory;throw err}
 // Filet de sécurité si l'ancien écran ne produit aucun marqueur de fin.
 fallbackTimer=setTimeout(()=>renderStable(page),3000);
 return result;
};
const observer=new MutationObserver(()=>{
 if(!desired||rendering)return;
 const text=main?.innerText||'';
 if(!enhancedActive){
   // Le répertoire historique affiche cette phrase une fois ses données rendues.
   if(/établissement\(s\) dans votre zone|données locales et répertoire SIRENE/i.test(text)){
     scheduleStable(desired,80);
   }
   return;
 }
 // Si une opération asynchrone historique réécrit malgré tout l'écran après
 // l'activation du nouvel annuaire, on le restaure une seule fois après 120 ms.
 if(!enhancedVisible(desired)){
   const page=desired;
   clearTimeout(settleTimer);
   settleTimer=setTimeout(()=>{if(desired===page&&!enhancedVisible(page))renderStable(page)},120);
 }
});
observer.observe(main,{childList:true,subtree:true,characterData:true});
})();
