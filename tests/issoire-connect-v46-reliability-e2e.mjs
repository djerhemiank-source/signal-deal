import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const APP=process.env.IC_APP||'https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const CLAIMED_BUSINESS='55ee92fa-bbe2-46a1-bdcc-e4cfe0bfad97'; // Altéra Créations
const UNCLAIMED_BUSINESS='ebfaaffd-eda8-4848-a94a-def5561d0fa5'; // 28 BIS - SIRENE officiel
const NON_RESERVABLE_OFFER='99f29446-c688-4500-90c1-c7093dc5cb2f';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

try{
  await page.goto(APP+`?v46-reliability=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.icV46Reliability&&typeof window.icV46LoadBusinessAuthority==='function',null,{timeout:25000});

  // 1) Une entreprise reliée à un compte doit conserver son owner_id côté client.
  const claimed=await page.evaluate(async id=>{
    const b=await window.icV46LoadBusinessAuthority(id);
    return b&&{id:b.id,name:b.name,owner_id:b.owner_id,is_claimed:b.is_claimed,source:b.source};
  },CLAIMED_BUSINESS);
  assert.equal(claimed?.id,CLAIMED_BUSINESS,'Entreprise revendiquée introuvable');
  assert(claimed?.owner_id,'owner_id perdu : la messagerie serait faussement désactivée');
  console.log('PASS claimed business authority',claimed.name);

  // 2) Une fiche SIRENE sans propriétaire ne doit jamais ouvrir un faux formulaire de messagerie.
  const unclaimed=await page.evaluate(async id=>{
    const b=await window.icV46LoadBusinessAuthority(id);
    await window.messageBusiness(id);
    return {
      b:b&&{id:b.id,name:b.name,owner_id:b.owner_id,is_claimed:b.is_claimed,source:b.source},
      modal:document.querySelector('#modalBody')?.innerText||''
    };
  },UNCLAIMED_BUSINESS);
  assert.equal(unclaimed?.b?.owner_id,null,'La fiche témoin ne devrait pas avoir de propriétaire');
  assert.equal(unclaimed?.b?.source,'sirene_officiel');
  assert.match(unclaimed.modal,/Messagerie Issoire Connect non disponible/i,'Le garde-fou de messagerie ne s’affiche pas');
  assert.match(unclaimed.modal,/C’est mon entreprise/i,'La revendication de fiche doit être proposée');
  console.log('PASS unclaimed messaging guard',unclaimed.b.name);
  await page.evaluate(()=>typeof closeModal==='function'&&closeModal());

  // 3) Une offre non réservable ne doit jamais promettre « Réserver ».
  const reservation=await page.evaluate(async id=>{
    const {data,error}=await sb.from('ic_offers').select('id,business_id,reservation_enabled').eq('id',id).maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('Offre témoin absente');
    S.offers=S.offers||[];
    const i=S.offers.findIndex(x=>x.id===data.id);if(i>=0)Object.assign(S.offers[i],data);else S.offers.push(data);
    const btn=document.createElement('button');btn.id='icV46ReservationProbe';btn.setAttribute('onclick',`reserveOffer('${data.id}')`);btn.textContent='Réserver';document.body.appendChild(btn);
    window.icV46Reliability.syncReservationButtons(document);
    return {text:btn.textContent,disabled:btn.disabled,onclick:btn.getAttribute('onclick')||''};
  },NON_RESERVABLE_OFFER);
  assert.notMatch(reservation.text,/^Réserver$/i,'Un faux bouton Réserver reste visible');
  assert(/Voir le professionnel|Réservation indisponible/i.test(reservation.text),'Le CTA de secours est incorrect');
  console.log('PASS non-reservable offer guard',reservation.text);

  assert.equal(pageErrors.length,0,'Page errors: '+pageErrors.join(' | '));
  console.log('ISSOIRE CONNECT V46 RELIABILITY E2E PASS');
} finally {
  await context.close();
  await browser.close();
}
