(()=>{
  const HOME_URL='https://djerhemiank-source.github.io/signal-deal/';

  function goHome(e){
    if(e)e.preventDefault();
    try{history.replaceState({},'',HOME_URL)}catch(_e){}
    window.scrollTo({top:0,left:0,behavior:'smooth'});
  }

  function wire(){
    const brand=document.querySelector('.brand');
    if(!brand||brand.dataset.sdHomeWired==='1')return;
    brand.dataset.sdHomeWired='1';
    brand.setAttribute('role','link');
    brand.setAttribute('tabindex','0');
    brand.setAttribute('title','Retour à l’accueil');
    brand.style.cursor='pointer';
    brand.style.textDecoration='none';
    brand.addEventListener('click',goHome);
    brand.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();goHome(e)}
    });
  }

  wire();
  const obs=new MutationObserver(()=>wire());
  obs.observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(wire,300);
})();