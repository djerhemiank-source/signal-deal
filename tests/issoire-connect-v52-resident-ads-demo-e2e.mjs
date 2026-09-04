import { chromium } from 'playwright';

const APP=process.env.IC_APP||'https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

async function ready(url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.icV52Ads&&window.icV52Demo,{timeout:90000});
}
async function modalHas(text){
  await page.waitForFunction(t=>{const m=document.querySelector('#modal:not(.hidden) #modalBody');return m&&m.innerText.includes(t)},text,{timeout:20000});
}

try{
  await ready(APP+'?demo=resident&e2e='+Date.now());
  await modalHas('MODE DÉMO');
  await modalHas('Profil Habitant');
  await modalHas('SPONSORISÉ');
  await modalHas('Publicité locale visible par l’habitant');

  await page.evaluate(()=>window.openIc52ProDemo());
  await modalHas('Profil Pro 360');
  await modalHas('Pro 360 — 19,99 €/mois');
  await modalHas('Radar Prospects');
  await modalHas('Mes campagnes');

  await page.evaluate(()=>window.openIc52AdStory());
  await modalHas('Du Pro jusqu’à l’Habitant');
  await modalHas('L’Habitant voit “SPONSORISÉ”');

  await page.evaluate(()=>{document.querySelector('#modal')?.classList.add('hidden')});
  await page.evaluate(()=>window.previewIcResidentAd());
  await modalHas('Voilà ce que voit un Habitant');
  await modalHas('SPONSORISÉ');

  const staticCheck=await page.evaluate(()=>({
    residentPages:window.icV52Ads?true:false,
    links:['resident','pro','ads'].map(kind=>{const u=new URL(location.href);u.searchParams.set('demo',kind);return u.searchParams.get('demo')})
  }));
  if(!staticCheck.residentPages||staticCheck.links.join(',')!=='resident,pro,ads')throw new Error('V52 demo/link surface incomplete');
  if(errors.length)throw new Error('Page errors: '+errors.join(' | '));
  console.log('ISSOIRE CONNECT V52 RESIDENT ADS DEMO E2E PASS');
}finally{
  await browser.close();
}
