import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const APP=process.env.IC_APP||'https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const AGENDA='00000000-0000-4000-8000-000000000511';
const NOTIFICATION='00000000-0000-4000-8000-000000000512';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

try{
  await page.goto(APP+`?v51-e2e=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.icV51?.version==='51.0'&&window.icV50?.version==='50.0'&&window.icV49?.version==='49.0',null,{timeout:25000});
  console.log('PASS V51 module loaded');

  await page.evaluate(()=>{
    S.session={user:{id:'00000000-0000-4000-8000-000000000599'}};
    S.page='agenda';
  });
  await page.evaluate(()=>openIcAgendaForm());
  await page.waitForSelector('#icaReminder',{timeout:5000});
  const options=await page.locator('#icaReminder option').allTextContents();
  assert.deepEqual(options,['Aucun rappel','30 minutes avant','1 heure avant','1 jour avant']);
  assert.equal(await page.locator('#icaReminder').inputValue(),'60');
  console.log('PASS reminder selector and 1h default');

  const future=new Date(Date.now()+3*3600_000);
  const local=`${future.getFullYear()}-${String(future.getMonth()+1).padStart(2,'0')}-${String(future.getDate()).padStart(2,'0')}T${String(future.getHours()).padStart(2,'0')}:${String(future.getMinutes()).padStart(2,'0')}`;
  await page.fill('#icaTitle','Rendez-vous V51');
  await page.fill('#icaStart',local);
  await page.selectOption('#icaReminder','30');

  await page.evaluate(()=>{
    window.__v51Insert=null;
    const originalFrom=sb.from.bind(sb);
    window.__v51OriginalFrom=originalFrom;
    sb.from=function(table){
      if(table==='ic_personal_agenda')return {
        insert(payload){window.__v51Insert=payload;return Promise.resolve({data:null,error:null})}
      };
      return originalFrom(table);
    };
    window.renderIcAgenda=async()=>{};
    window.say=msg=>{window.__v51Say=msg};
  });
  await page.evaluate(()=>saveIcAgendaItem());
  const payload=await page.evaluate(()=>window.__v51Insert);
  assert.equal(payload.reminder_minutes,30);
  assert.equal(payload.title,'Rendez-vous V51');
  console.log('PASS selected reminder is persisted');

  await page.evaluate(({agenda,notification})=>{
    S.page='agenda';
    main.innerHTML=`<article class="card" data-agenda-id="${agenda}">Rendez-vous cible</article>`;
    window.renderIcAgenda=async()=>{};
    if(window.icV49)window.icV49.refreshBadge=async()=>0;
    sb.from=function(table){
      if(table==='ic_notifications')return {
        update(){return {eq(){return {eq(){return Promise.resolve({data:null,error:null})}}}}}
      };
      return {select(){return this},eq(){return this},order(){return this},limit(){return Promise.resolve({data:[],error:null})}};
    };
    history.replaceState({},'',location.pathname+`?notification=agenda&id=${agenda}&notification_id=${notification}`);
  },{agenda:AGENDA,notification:NOTIFICATION});
  const handled=await page.evaluate(()=>icV51.handleDeepLink());
  assert.equal(handled,true);
  assert.equal(await page.evaluate(()=>location.search),'');
  console.log('PASS agenda Push deep-link opens once and clears URL');

  assert.equal(pageErrors.length,0,'Page errors: '+pageErrors.join(' | '));
  console.log('ISSOIRE CONNECT V51 AGENDA REMINDERS E2E PASS');
} finally {
  await context.close();
  await browser.close();
}
