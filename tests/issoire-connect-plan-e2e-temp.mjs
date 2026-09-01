import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const APP='https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const PASS='IcTest-dI944aZBleDX1g';
const accounts=[
 {plan:'Essential',email:'ic-e2e-essential-095b37d5@example.com',business:'TEST Essential Issoire',price:'4,99 € / mois',max:5,next:10},
 {plan:'Pro',email:'ic-e2e-pro-86f871a0@example.com',business:'TEST Pro Issoire',price:'9,99 € / mois',max:20,next:30},
 {plan:'Pro+',email:'ic-e2e-proplus-4ce3e733@example.com',business:'TEST ProPlus Issoire',price:'19,99 € / mois',max:50,next:null}
];

async function toast(page,text){await page.waitForFunction(t=>document.querySelector('#toast')?.textContent.includes(t),text,{timeout:15000});}
async function closeModal(page){const m=page.locator('.modalback');if(await m.isVisible().catch(()=>false))await m.click();}
async function clickTile(page,text){const b=page.locator('button.tile',{hasText:text}).first();await b.waitFor({state:'visible',timeout:8000});await b.click();}
async function publishProduct(page,label){await clickTile(page,'Produit/service');await page.locator('#pt').fill(`E2E produit ${label}`);await page.locator('#pd').fill('Produit temporaire de validation');await page.locator('#pp').fill('12.50');await page.locator('#modalBody button',{hasText:'Publier'}).click();await toast(page,'Produit/service publié');}
async function publishOffer(page,label,type='Promotion'){
 await clickTile(page,type);
 await page.locator('#ot').fill(`E2E ${type} ${label}`);await page.locator('#od').fill('Offre temporaire de validation');await page.locator('#oo').fill('10');await page.locator('#os').fill('5');await page.locator('#oq').fill('4');
 await page.locator('#modalBody button',{hasText:'Publier'}).click();await toast(page,'Offre publiée');
}
async function publishJob(page,label){await clickTile(page,'Emploi');await page.locator('#jt').fill(`E2E emploi ${label}`);await page.locator('#jd').fill('Offre temporaire de validation');await page.locator('#js').fill('Test');await page.locator('#modalBody button',{hasText:'Publier'}).click();await toast(page,"Offre d’emploi publiée");}
async function publishEvent(page,label){await clickTile(page,'Événement');await page.locator('#bet').fill(`E2E événement ${label}`);await page.locator('#bed').fill('2026-09-05T12:00');await page.locator('#bee').fill('Événement temporaire de validation');await page.locator('#modalBody button',{hasText:'Publier'}).click();await toast(page,'Événement publié');}
async function publishAd(page,label,expectText){await clickTile(page,'Pub locale');await page.locator('#modalBody').waitFor({state:'visible'});assert.match(await page.locator('#modalBody').innerText(),expectText);await page.locator('#at').fill(`E2E publicité ${label}`);await page.locator('#modalBody button',{hasText:'Lancer la campagne'}).click();await toast(page,'Campagne créée');}

const browser=await chromium.launch({headless:true});
for(const a of accounts){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];const authResponses=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',async res=>{if(!res.url().includes('/auth/v1/token'))return;try{const j=await res.json();authResponses.push({status:res.status(),hasAccessToken:!!j.access_token,error:j.error||null,error_description:j.error_description||null,msg:j.msg||j.message||null,error_code:j.error_code||j.code||null})}catch{authResponses.push({status:res.status(),parse:false})}});
 let r=await page.goto(APP+'?e2e='+Date.now(),{waitUntil:'domcontentloaded',timeout:25000});assert(r?.ok(),'app HTTP');
 await page.locator('[data-page="account"]').waitFor({state:'visible',timeout:20000});await page.locator('[data-page="account"]').click();
 const login=page.locator('button',{hasText:'Connexion / inscription'});await login.waitFor({state:'visible',timeout:10000});await login.click();
 await page.locator('#authEmail').fill(a.email);await page.locator('#authPass').fill(PASS);await page.locator('#authGo').click();
 try{await page.waitForFunction(name=>(document.querySelector('main')?.innerText||'').includes(name),a.business,{timeout:20000})}catch(err){const diag=await page.evaluate(()=>({toast:document.querySelector('#toast')?.textContent||'',main:(document.querySelector('main')?.innerText||'').slice(0,1200),modal:(document.querySelector('#modalBody')?.innerText||'').slice(0,800),session:!!globalThis.S?.session,uid:globalThis.S?.session?.user?.id||null,role:globalThis.S?.profile?.role||null,myBusinesses:(globalThis.S?.myBusinesses||[]).map(x=>({id:x.id,name:x.name,plan:x.plan}))}));console.log('AUTH_DIAG',a.plan,JSON.stringify({authResponses,diag}));throw err}
 await page.waitForFunction(()=>document.querySelector('#icPlanPanel'),null,{timeout:8000});
 const body=await page.locator('main').innerText();assert.match(body,new RegExp(a.plan.replace('+','\\+')));assert(body.includes(a.price),`${a.plan} price missing`);
 const maxBtn=page.locator('.radiuschoices button',{hasText:`${a.max} km`}).first();await maxBtn.waitFor({state:'visible',timeout:8000});assert(!(await maxBtn.getAttribute('class')||'').includes('locked'),`${a.plan} max radius locked`);
 if(a.next){const locked=page.locator('.radiuschoices button',{hasText:`${a.next} km`}).first();assert((await locked.getAttribute('class')||'').includes('locked'),`${a.plan} next radius should be locked`);await locked.click();assert.match(await page.locator('#modalBody').innerText(),/Étendre votre zone|forfait/i);await closeModal(page)}
 await publishProduct(page,a.plan);await publishOffer(page,a.plan,'Promotion');
 if(a.plan==='Essential'){
   await publishOffer(page,a.plan,'Invendu');
   await clickTile(page,'Promotion');assert.match(await page.locator('#modalBody').innerText(),/Limite de 2 offres ou invendus/i);await closeModal(page);
   await clickTile(page,'Emploi');assert.match(await page.locator('#modalBody').innerText(),/nécessite|forfait|Pro — 9,99 €/i);await closeModal(page);
   await clickTile(page,'Événement');assert.match(await page.locator('#modalBody').innerText(),/Pro — 9,99 €/i);await closeModal(page);
   await clickTile(page,'Pub locale');assert.match(await page.locator('#modalBody').innerText(),/Pro — 9,99 €/i);await closeModal(page);
 }else{await publishJob(page,a.plan);await publishEvent(page,a.plan);await publishAd(page,a.plan,a.plan==='Pro'?/campagne sponsorisée standard/i:/campagne sponsorisée incluse/i)}
 await page.evaluate(()=>openIcPlans());await page.locator('.modalback').waitFor({state:'visible',timeout:5000});
 const target=a.plan==='Essential'?'Pro':'Essential';const popupPromise=page.waitForEvent('popup',{timeout:8000});await page.locator('#modalBody button',{hasText:`Choisir ${target}`}).click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded',{timeout:15000}).catch(()=>{});const pu=popup.url();assert.match(pu,/buy\.stripe\.com\/test_/);assert.match(pu,/client_reference_id=/);await popup.close();await closeModal(page);
 assert.equal(errors.length,0,errors.join(' | '));console.log('PLAN PASS',a.plan);await context.close();
}
await browser.close();console.log('ISSOIRE CONNECT CONNECTED PLAN E2E PASS');
