import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const APP=process.env.IC_APP||'https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const EMAIL='ic-e2e-proplus-4ce3e733@example.com';
const PASS='IcTest-dI944aZBleDX1g';
const stamp=Date.now();
const serviceName=`E2E prestation V40 ${stamp}`;
const benefitTitle=`E2E avantage V40 ${stamp}`;

async function toast(page,text,timeout=15000){
  await page.waitForFunction(t=>document.querySelector('#toast')?.textContent.includes(t),text,{timeout});
}
async function login(page){
  await page.goto(APP+`?pro-actions=${stamp}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('[data-page="account"]').waitFor({state:'visible',timeout:20000});
  await page.locator('[data-page="account"]').click();
  const login=page.locator('button',{hasText:'Connexion / inscription'});
  if(await login.isVisible().catch(()=>false)){
    await login.click();
    await page.locator('#authEmail').fill(EMAIL);
    await page.locator('#authPass').fill(PASS);
    await page.locator('#authGo').click();
  }
  await page.waitForFunction(()=>/TEST ProPlus Issoire/.test(document.querySelector('main')?.innerText||''),null,{timeout:25000});
}
async function cleanup(page){
  await page.evaluate(async ({serviceName,benefitTitle})=>{
    try{await sb.from('ic_products').delete().eq('name',serviceName)}catch{}
    try{await sb.from('ic_offers').delete().eq('title',`🎁 ${benefitTitle}`)}catch{}
  },{serviceName,benefitTitle});
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const pageErrors=[];
const consoleErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

try{
  await login(page);

  // 1) Publier une prestation via le nouveau formulaire V40.
  const serviceBtn=page.locator('button',{hasText:'+ Prestation'}).first();
  await serviceBtn.waitFor({state:'visible',timeout:12000});
  await serviceBtn.click();
  await page.locator('#icsName').fill(serviceName);
  await page.locator('#icsDesc').fill('Prestation temporaire de validation automatique.');
  await page.locator('#icsPrice').fill('25');
  await page.locator('#modalBody button',{hasText:'Publier la prestation'}).click();
  await toast(page,'Prestation publiée.');
  const serviceRow=await page.evaluate(async name=>{
    const {data,error}=await sb.from('ic_products').select('id,name,kind,is_active').eq('name',name).order('created_at',{ascending:false}).limit(1).maybeSingle();
    return {data,error:error?error.message:null};
  },serviceName);
  assert.equal(serviceRow.error,null,serviceRow.error||'service query failed');
  assert.equal(serviceRow.data?.name,serviceName,'prestation absente de Supabase');
  console.log('PASS prestation',serviceRow.data.id);

  // 2) Publier un avantage Issoire Connect.
  await page.locator('[data-page="account"]').click();
  await page.waitForFunction(()=>/TEST ProPlus Issoire/.test(document.querySelector('main')?.innerText||''),null,{timeout:10000});
  const benefitBtn=page.locator('button',{hasText:'Créer un avantage'}).first();
  await benefitBtn.waitFor({state:'visible',timeout:12000});
  await benefitBtn.click();
  await page.locator('#icbTitle').fill(benefitTitle);
  await page.locator('#icbKind').selectOption('percent');
  await page.locator('#icbValue').fill('10');
  await page.locator('#icbDesc').fill('Avantage temporaire de validation automatique.');
  await page.locator('#modalBody button',{hasText:"Publier l’avantage"}).click();
  await toast(page,'Avantage Issoire Connect publié.');
  const benefitRow=await page.evaluate(async title=>{
    const {data,error}=await sb.from('ic_offers').select('id,title,member_only,benefit_kind,benefit_value').eq('title',`🎁 ${title}`).order('created_at',{ascending:false}).limit(1).maybeSingle();
    return {data,error:error?error.message:null};
  },benefitTitle);
  assert.equal(benefitRow.error,null,benefitRow.error||'benefit query failed');
  assert.equal(benefitRow.data?.member_only,true,'avantage non marqué membre');
  console.log('PASS avantage',benefitRow.data.id);

  // 3) Lancer le Radar Prospects Pro 360 et vérifier la réponse de l’Edge Function.
  await page.locator('[data-page="account"]').click();
  await page.waitForFunction(()=>/TEST ProPlus Issoire/.test(document.querySelector('main')?.innerText||''),null,{timeout:10000});
  await page.evaluate(()=>openIcProspectRadarV40());
  await page.locator('#icV40Profession').waitFor({state:'visible',timeout:10000});
  await page.locator('#icV40Profession').fill('plombier');
  await page.locator('#icV40City').fill('Issoire');
  await page.locator('#icV40Postal').fill('63500');
  await page.locator('#icV40Radius').selectOption('20');
  const radarResponse=page.waitForResponse(r=>r.url().includes('/functions/v1/ic-prospect-radar'),{timeout:25000});
  await page.locator('#icV40Run').click();
  const rr=await radarResponse;
  const body=await rr.text();
  assert(rr.ok(),`radar HTTP ${rr.status()} ${body.slice(0,600)}`);
  let json={};try{json=JSON.parse(body)}catch{}
  assert(!json.error,`radar error ${JSON.stringify(json)}`);
  await page.waitForFunction(()=>/résultat\(s\)/i.test(document.querySelector('main')?.innerText||''),null,{timeout:12000});
  console.log('PASS radar',json.loaded ?? json.items?.length ?? 'ok');

  assert.equal(pageErrors.length,0,'page errors: '+pageErrors.join(' | '));
  console.log('ISSOIRE CONNECT PRO ACTIONS E2E PASS');
} finally {
  await cleanup(page).catch(()=>{});
  if(consoleErrors.length)console.log('CONSOLE_ERRORS',JSON.stringify(consoleErrors.slice(0,20)));
  await context.close();
  await browser.close();
}
