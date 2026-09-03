import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const APP=process.env.IC_APP||'https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const EMAIL='ic-e2e-proplus-4ce3e733@example.com';
const PASS='IcTest-dI944aZBleDX1g';
const BUSINESS='a898b07b-3f41-4b16-8821-47e7608ba566';
const marker=`V47 avis membre E2E ${Date.now()}`;

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

async function waitReviews(){
  await page.locator('#ic47ReviewSection').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>{
    const el=document.getElementById('ic47ReviewSection');
    if(!el)return false;
    const t=el.innerText||'';
    return !/Chargement des avis/i.test(t) && (/AVIS & RECOMMANDATIONS/i.test(t)||/Impossible de charger les avis/i.test(t));
  },null,{timeout:15000});
}

async function cleanup(){
  try{
    await page.evaluate(async ({business,marker})=>{
      if(!S?.session||!sb)return;
      const {data}=await sb.rpc('ic_business_reviews',{p_business:business,p_limit:100,p_offset:0});
      const row=(data||[]).find(r=>r.is_mine===true&&r.comment===marker);
      if(row)await sb.rpc('ic_delete_my_review',{p_review:row.id});
    },{business:BUSINESS,marker});
  }catch{}
}

try{
  await page.goto(APP+`?v47-e2e=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.icV47?.version==='47.0'&&window.icV47BusinessModalFix?.version==='47.0'&&typeof window.openIcMessagesV47==='function',null,{timeout:25000});
  console.log('PASS V47 module + modal fix loaded');

  await page.evaluate(id=>viewBusiness(id),BUSINESS);
  await waitReviews();
  const publicReviews=await page.locator('#ic47ReviewSection').innerText();
  assert.match(publicReviews,/AVIS & RECOMMANDATIONS/i);
  assert.match(publicReviews,/Avis vérifié/i);
  console.log('PASS public reviews block');
  await page.evaluate(()=>closeModal());

  await page.evaluate(()=>go('account'));
  await page.locator('button',{hasText:'Connexion / inscription'}).click();
  await page.locator('#authEmail').fill(EMAIL);
  await page.locator('#authPass').fill(PASS);
  await page.locator('#authGo').click();
  await page.waitForFunction(()=>!!S.session,null,{timeout:20000});
  console.log('PASS login');

  const before=await page.evaluate(id=>({
    publicCount:(S.businesses||[]).filter(b=>b.id===id).length,
    myCount:(S.myBusinesses||[]).filter(b=>b.id===id).length,
    publicName:(S.businesses||[]).find(b=>b.id===id)?.name||null,
    ownerKnown:(S.businesses||[]).find(b=>b.id===id)?.owner_id!==undefined,
    modalHidden:document.getElementById('modal')?.classList.contains('hidden'),
    modalText:(document.getElementById('modalBody')?.innerText||'').slice(0,120),
    hotfix:window.icV47BusinessModalFix?.version||null
  }),BUSINESS);
  console.log('DIAG before reopen',JSON.stringify(before));

  const after=await page.evaluate(async id=>{
    const r=window.viewBusiness(id);
    if(r&&typeof r.then==='function')await r;
    await new Promise(resolve=>setTimeout(resolve,500));
    return {
      publicCount:(S.businesses||[]).filter(b=>b.id===id).length,
      publicName:(S.businesses||[]).find(b=>b.id===id)?.name||null,
      modalHidden:document.getElementById('modal')?.classList.contains('hidden'),
      modalClass:document.getElementById('modal')?.className||null,
      modalText:(document.getElementById('modalBody')?.innerText||'').slice(0,180),
      reviewVisible:!!document.getElementById('ic47ReviewSection')&&getComputedStyle(document.getElementById('ic47ReviewSection')).display!=='none'&&getComputedStyle(document.getElementById('modal')).display!=='none'
    };
  },BUSINESS);
  console.log('DIAG after reopen',JSON.stringify(after));
  assert.equal(after.modalHidden,false,'La fiche entreprise doit rouvrir le modal après connexion');
  assert.equal(after.publicCount,1,'La fiche doit être synchronisée dans S.businesses');

  await waitReviews();
  await page.locator('#ic47ReviewSection button',{hasText:/Donner mon avis|Modifier mon avis/}).click();
  await page.locator('#ic47ReviewRating').selectOption('5');
  await page.locator('#ic47ReviewComment').fill(marker);
  await page.locator('button',{hasText:'Publier'}).click();
  await waitReviews();
  const card=page.locator('#ic47ReviewSection article.card').filter({hasText:marker}).first();
  await card.waitFor({state:'visible',timeout:10000});
  const cardText=await card.innerText();
  assert.match(cardText,/Avis membre/i,'Un avis sans commande terminée doit rester un avis membre');
  assert.doesNotMatch(cardText,/✅ Avis vérifié/i,'L’avis E2E ne doit pas être marqué vérifié');
  console.log('PASS member review create');

  page.once('dialog',d=>d.accept());
  await card.locator('button',{hasText:'Supprimer'}).click();
  await page.waitForTimeout(900);
  const remaining=await page.locator('#ic47ReviewSection article.card').filter({hasText:marker}).count();
  assert.equal(remaining,0,'L’avis E2E n’a pas été supprimé');
  console.log('PASS review delete cleanup');

  await page.evaluate(()=>{try{closeModal()}catch{};openIcMessagesV47()});
  await page.locator('#main').getByText('Mes conversations',{exact:true}).waitFor({state:'visible',timeout:10000});
  const mainText=await page.locator('#main').innerText();
  assert.match(mainText,/Historique regroupé par interlocuteur et par contexte/i);
  console.log('PASS conversation inbox UI');

  assert.equal(pageErrors.length,0,'Page errors: '+pageErrors.join(' | '));
  console.log('ISSOIRE CONNECT V47 REVIEWS MESSAGING E2E PASS');
} finally {
  await cleanup();
  await context.close();
  await browser.close();
}
