import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const APP=process.env.IC_APP||'https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const EMAIL='ic-e2e-proplus-4ce3e733@example.com';
const PASS='IcTest-dI944aZBleDX1g';
const BUSINESS='a898b07b-3f41-4b16-8821-47e7608ba566';
const COMPLETED='00000000-0000-4000-8000-000000000481';
const RESERVATION='00000000-0000-4000-8000-000000000482';
const AGENDA='00000000-0000-4000-8000-000000000483';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

try{
  await page.goto(APP+`?v48-e2e=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.icV48?.version==='48.0'&&window.icV47?.version==='47.0',null,{timeout:25000});
  console.log('PASS V48 module loaded');

  await page.evaluate(()=>go('account'));
  const loginButton=page.locator('button',{hasText:'Connexion / inscription'});
  if(await loginButton.count()){
    await loginButton.click();
    await page.locator('#authEmail').fill(EMAIL);
    await page.locator('#authPass').fill(PASS);
    await page.locator('#authGo').click();
  }
  await page.waitForFunction(()=>!!S.session&&S.page==='account'&&!document.getElementById('modal')?.classList.contains('hidden')===false,null,{timeout:20000}).catch(async()=>{
    await page.waitForFunction(()=>!!S.session&&S.page==='account',null,{timeout:20000});
    await page.waitForTimeout(700);
  });
  console.log('PASS login complete');

  await page.evaluate(({business,completed,reservation,agenda})=>{
    window.__v48OriginalRpc=sb.rpc.bind(sb);
    window.__v48Calls=[];
    window.__v48FakeRows=[
      {
        order_id:completed,business_id:business,business_name:'Imprimerie Démo Issoire',business_category:'Imprimerie',
        status:'completed',order_type:'order',total:25,reservation_expires_at:null,updated_at:new Date().toISOString(),
        item_label:'Impression test',review_id:null,review_rating:null,review_verified:false,agenda_id:null,can_review:true,can_add_agenda:false
      },
      {
        order_id:reservation,business_id:business,business_name:'Imprimerie Démo Issoire',business_category:'Imprimerie',
        status:'accepted',order_type:'reservation',total:12.5,reservation_expires_at:new Date(Date.now()+7200000).toISOString(),updated_at:new Date().toISOString(),
        item_label:'Retrait test',review_id:null,review_rating:null,review_verified:false,agenda_id:null,can_review:false,can_add_agenda:true
      }
    ];
    sb.rpc=async function(name,args){
      window.__v48Calls.push({name,args});
      if(name==='ic_my_transaction_experience')return {data:window.__v48FakeRows.map(x=>({...x})),error:null};
      if(name==='ic_add_order_to_agenda'){
        const row=window.__v48FakeRows.find(x=>x.order_id===args?.p_order);if(row)row.agenda_id=agenda;
        return {data:{id:agenda},error:null};
      }
      if(name==='ic_set_order_status')return {data:null,error:null};
      return window.__v48OriginalRpc(name,args);
    };
  },{business:BUSINESS,completed:COMPLETED,reservation:RESERVATION,agenda:AGENDA});

  await page.evaluate(()=>icV48.renderAccountExperience());
  await page.locator('#ic48TransactionExperience').waitFor({state:'visible',timeout:10000});
  const experienceText=await page.locator('#ic48TransactionExperience').innerText();
  assert.match(experienceText,/Achats, réservations & avis vérifiés/i);
  assert.match(experienceText,/Donner un avis vérifié/i);
  assert.match(experienceText,/Ajouter le retrait à mon agenda/i);
  console.log('PASS transaction experience panel');

  await page.locator('#ic48TransactionExperience button',{hasText:'Donner un avis vérifié'}).click();
  await page.locator('#ic47ReviewRating').waitFor({state:'visible',timeout:10000});
  const reviewModal=await page.locator('#modalBody').innerText();
  assert.match(reviewModal,/Donner mon avis/i);
  assert.match(reviewModal,/badge « vérifié »/i);
  console.log('PASS verified review CTA');
  await page.evaluate(()=>closeModal());

  await page.locator('#ic48TransactionExperience button',{hasText:'Ajouter le retrait à mon agenda'}).click();
  await page.locator('#ic48TransactionExperience button',{hasText:'Voir dans mon agenda'}).waitFor({state:'visible',timeout:10000});
  const agendaCalls=await page.evaluate(()=>window.__v48Calls.filter(x=>x.name==='ic_add_order_to_agenda'));
  assert.equal(agendaCalls.length,1);
  assert.equal(agendaCalls[0].args.p_order,RESERVATION);
  console.log('PASS agenda CTA and deduped UI state');

  await page.evaluate(id=>setOrder(id,'ready'),COMPLETED);
  await page.waitForFunction(()=>window.__v48Calls.some(x=>x.name==='ic_set_order_status'),null,{timeout:10000});
  const statusCall=await page.evaluate(()=>window.__v48Calls.find(x=>x.name==='ic_set_order_status'));
  assert.deepEqual(statusCall.args,{p_order_id:COMPLETED,p_status:'ready'});
  console.log('PASS secure order status RPC wiring');

  assert.equal(pageErrors.length,0,'Page errors: '+pageErrors.join(' | '));
  console.log('ISSOIRE CONNECT V48 TRANSACTION EXPERIENCE E2E PASS');
} finally {
  await context.close();
  await browser.close();
}
