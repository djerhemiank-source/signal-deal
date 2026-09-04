(function(){
  'use strict';
  function patchV60Labels(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      if(n.nodeValue){
        if(n.nodeValue.includes('V.58')||n.nodeValue.includes('V.59')) n.nodeValue=n.nodeValue.replaceAll('V.58','V.60').replaceAll('V.59','V.60');
        if(n.nodeValue.includes('avant la release publique V.60')) n.nodeValue=n.nodeValue.replaceAll('avant la release publique V.60','avant toute activation des paiements LIVE');
      }
    }
    document.title='Issoire Connect V.60';
  }
  const baseRender=render;
  render=function(){baseRender();patchV60Labels(document.body)};
  patchV60Labels(document.body);
})();
