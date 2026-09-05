(function(){
  'use strict';
  function patchV62Labels(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      if(!n.nodeValue)continue;
      if(n.nodeValue.includes('V.58')||n.nodeValue.includes('V.59')||n.nodeValue.includes('V.60')){
        n.nodeValue=n.nodeValue.replaceAll('V.58','V.62').replaceAll('V.59','V.62').replaceAll('V.60','V.62');
      }
    }
    document.title='Issoire Connect V.62';
  }
  const baseRenderV62=render;
  render=function(){baseRenderV62();patchV62Labels(document.body)};
  patchV62Labels(document.body);
})();
