import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const APP=process.env.IC_APP||'https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const EMAIL='ic-e2e-proplus-4ce3e733@example.com';
const PASS='IcTest-dI944aZBleDX1g';
const ORDER='00000000-0000-4000-8000-000000000491';
const N1='00000000-0000-4000-8000-000000000492';
const N2='00000000-0000-4000-8000-000000000493';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

try{
  await page.goto(APP+`?v49-e2e=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.icV49?.version==='49.0'&&window.icV48?.version==='48.0',null,{timeout:25000});
  console.log('PASS V49 module loaded');

  await page.evaluate(()=>go('account'));
  const loginButton=page.locator('button',{hasText:'Connexion / inscription'});
  if(await loginButton.count()){
    await loginButton.click();
    await page.locator('#authEmail').fill(EMAIL);
    await page.locator('#authPass').fill(PASS);
    await page.locator('#authGo').click();
  }
  await page.waitForFunction(()=>!!S.session&&S.page==='account',null,{timeout:20000});
  await page.waitForTimeout(800);
  console.log('PASS login complete');

  await page.evaluate(({order,n1,n2})=>{
    window.__v49OriginalFrom=sb.from.bind(sb);
    window.__v49Fake=[
      {id:n1,title:'Transaction terminée',body:'Vous pouvez maintenant laisser un avis vérifié au professionnel.',link_type:'order',link_id:order,read_at:null,created_at:new Date().toISOString(),business_alert_id:null},
      {id:n2,title:'Votre réservation est prête',body:'Consultez la transaction pour les informations de retrait.',link_type:'order',link_id:order,read_at:null,created_at:new Date(Date.now()-60000).toISOString(),business_alert_id:null}
    ];
    window.__v49Updates=[];
    sb.from=function(table){
      if(table!=='ic_notifications')return window.__v49OriginalFrom(table);
      const state={mode:'select',payload:null,id:null,unreadOnly:false};
      const q={
        select(){state.mode='select';return q},
        update(payload){state.mode='update';state.payload=payload;return q},
        eq(field,value){if(field==='id')state.id=value;return q},
        order(){return q},
        limit(){return q},
        is(field,value){if(field==='read_at'&&value===null)state.unreadOnly=true;return q},
        then(resolve,reject){
          try{
            if(state.mode==='select')return resolve({data:window.__v49Fake.map(x=>({...x})),error:null});
            const stamp=state.payload?.read_at||new Date().toISOString();
            for(const row of window.__v49Fake){
              if(state.id&&row.id!==state.id)continue;
              if(state.unreadOnly&&row.read_at)continue;
              row.read_at=stamp;
            }
            window.__v49Updates.push({id:state.id,unreadOnly:state.unreadOnly,payload:state.payload});
            return resolve({data:null,error:null});
          }catch(e){return reject(e)}
        }
      };
      return q;
    };
    window.__v49Focused=null;
    window.__v49OriginalFocus=window.icV48.focusOrder;
    window.icV48.focusOrder=async function(id){window.__v49Focused=id;return true};
  },{order:ORDER,n1:N1,n2:N2});

  await page.evaluate(()=>icV49.refreshBadge());
  await page.waitForFunction(()=>document.getElementById('ic49NotificationBadge')?.textContent==='2',null,{timeout:10000});
  console.log('PASS unread badge');

  await page.evaluate(()=>openNotifications());
  await page.locator('#ic49NotificationList').getByText('Transaction terminée',{exact:true}).waitFor({state:'visible',timeout:10000});
  const centerText=await page.locator('#modalBody').innerText();
  assert.match(centerText,/Centre de notifications/i);
  assert.match(centerText,/2 NON LUE/i);
  assert.match(centerText,/Voir la transaction/i);
  console.log('PASS notification center');

  const completedCard=page.locator('#ic49NotificationList article.card').filter({hasText:'Transaction terminée'}).first();
  await completedCard.locator('button',{hasText:'Voir la transaction'}).click();
  await page.waitForFunction(order=>window.__v49Focused===order,ORDER,{timeout:10000});
  const focused=await page.evaluate(()=>window.__v49Focused);
  assert.equal(focused,ORDER);
  const afterOpenUnread=await page.evaluate(()=>window.__v49Fake.filter(x=>!x.read_at).length);
  assert.equal(afterOpenUnread,1);
  console.log('PASS order deep link + mark read');

  await page.evaluate(()=>openNotifications());
  await page.locator('#ic49NotificationList button',{hasText:/Tout marquer comme lu/i}).click();
  await page.waitForFunction(()=>window.__v49Fake.every(x=>!!x.read_at),null,{timeout:10000});
  await page.waitForFunction(()=>document.getElementById('ic49NotificationBadge')?.style.display==='none',null,{timeout:10000});
  console.log('PASS mark all read');

  assert.equal(pageErrors.length,0,'Page errors: '+pageErrors.join(' | '));
  console.log('ISSOIRE CONNECT V49 NOTIFICATIONS E2E PASS');
} finally {
  await context.close();
  await browser.close();
}
