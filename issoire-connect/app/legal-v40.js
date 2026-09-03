(()=>{
if(typeof window==='undefined')return;
const legalBase=()=>new URL('../',location.href).href;
window.openIcLegal=function(file){const allowed=new Set(['mentions-legales.html','confidentialite.html','cgu.html','cgv-pro.html']);if(!allowed.has(file))return;window.open(new URL(file,legalBase()).href,'_blank','noopener,noreferrer')};
function legalPanel(){return `<section id="icLegalV40" class="card" style="margin-top:16px"><div class="row between"><div><span class="pill">⚖️ INFORMATIONS & CONFIDENTIALITÉ</span><h3 style="margin:7px 0 3px">Documents Issoire Connect</h3><div class="muted">Documents de pré-lancement. Les informations d’identification de l’éditeur restent à compléter avant les paiements réels.</div></div></div><div class="actions" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:7px"><button class="btn" onclick="openIcLegal('mentions-legales.html')">Mentions légales</button><button class="btn" onclick="openIcLegal('confidentialite.html')">Confidentialité</button><button class="btn" onclick="openIcLegal('cgu.html')">CGU</button><button class="btn" onclick="openIcLegal('cgv-pro.html')">CGV Pro</button></div></section>`}
function inject(){if(typeof main==='undefined'||!main||document.getElementById('icLegalV40'))return;main.insertAdjacentHTML('beforeend',legalPanel())}
for(const name of ['accountPage','proAccount','adminAccount']){const old=window[name];if(typeof old==='function')window[name]=function(...args){const r=old.apply(this,args);setTimeout(inject,0);return r}}
})();
