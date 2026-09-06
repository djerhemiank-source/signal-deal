(function(){
'use strict';
const BUILD='2026-09-06-v64-mobile-install';
window.IC_INSTALLER_URL='installer.html?v=64.0';
window.openInstallerV64=function(){location.href=window.IC_INSTALLER_URL};
function patchV64Labels(root){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let n;
  while((n=walker.nextNode())){
    if(!n.nodeValue)continue;
    if(/V\.(58|59|60|61|62|63)/.test(n.nodeValue)){
      n.nodeValue=n.nodeValue.replace(/V\.(58|59|60|61|62|63)/g,'V.64');
    }
  }
  document.title='Issoire Connect V.64';
}
if(typeof render==='function'){
  const previousRender=render;
  render=function(){previousRender();patchV64Labels(document.body)};
}
window.addEventListener('pageshow',()=>patchV64Labels(document.body));
patchV64Labels(document.body);
console.info('Issoire Connect V.64 mobile/install',BUILD);
})();
