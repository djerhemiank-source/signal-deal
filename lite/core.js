(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SignalDealCore=api;})(typeof self!=='undefined'?self:this,function(){
'use strict';
const RULES={
  free:{label:'Gratuit',max:5,radius:10,details:false,pipeline:false,exportCsv:false},
  essential:{label:'Essentiel — 9,90 €',max:50,radius:10,details:true,pipeline:true,exportCsv:false},
  pro:{label:'Pro — 19,90 €',max:250,radius:25,details:true,pipeline:true,exportCsv:true},
  agency:{label:'Agence — 49,90 €',max:500,radius:50,details:true,pipeline:true,exportCsv:true}
};
function plan(p){p=String(p||'free').toLowerCase();return RULES[p]?p:'free';}
function rights(p){return {...RULES[plan(p)]};}
function clampRadius(p,r){const n=Math.max(1,Math.min(50,Number(r)||10));return Math.min(n,rights(p).radius);}
function capRows(p,rows){return (Array.isArray(rows)?rows:[]).slice(0,rights(p).max);}
function isPrinter(activity){return /(imprim|signal[eé]t|graph|print|reprograph)/i.test(String(activity||''));}
function relation(activity,naf,sector){const a=String(activity||'').toLowerCase(),n=String(naf||'').toUpperCase(),s=String(sector||'').toLowerCase();if(isPrinter(activity))return /^18\./.test(n)||/imprimerie|production graphique/.test(s)?'competitor':'prospect';if(/assur|courtier/.test(a)&&/assurance/.test(s))return'competitor';if(/boulanger|p[aâ]tiss/.test(a)&&/boulangerie/.test(s))return'competitor';if(/immobil/.test(a)&&/immobilier/.test(s))return'competitor';if(/restaurant|traiteur/.test(a)&&/restauration/.test(s))return'competitor';return'prospect';}
function recommendations(activity,sector){if(!isPrinter(activity))return['présenter vos services','qualifier le besoin','proposer un échange professionnel court'];const s=String(sector||'').toLowerCase();if(s.includes('assurance'))return['cartes de visite','flyers','vitrophanie','affiches','dossiers commerciaux'];if(s.includes('santé'))return['plaques et signalétique','cartes de rendez-vous','papeterie','affiches'];if(s.includes('boulangerie'))return['affiches prix','menus','stickers','étiquettes','packaging'];if(s.includes('commerce'))return['PLV','affiches','flyers','étiquettes','signalétique magasin'];if(s.includes('immobilier'))return['panneaux','flyers','brochures','vitrophanie','cartes de visite'];return['cartes de visite','flyers','affiches','signalétique','supports commerciaux'];}
function startupPolicy(){return{automaticNetwork:false,serviceWorker:false,autoPolling:false,autoSessionRestore:false};}
return{RULES,plan,rights,clampRadius,capRows,isPrinter,relation,recommendations,startupPolicy};
});
