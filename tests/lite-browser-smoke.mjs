import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173/lite/';

async function runViewport(name, viewport) {
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors=[];
  const pageErrors=[];
  const externalStartup=[];
  let initialLoaded=false;

  page.on('console',m=>{ if(m.type()==='error') consoleErrors.push(m.text()); });
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('request',req=>{
    const u=req.url();
    if(!initialLoaded && (/supabase\.co/i.test(u) || /stripe\.com/i.test(u))) externalStartup.push(u);
  });

  const start=Date.now();
  const response=await page.goto(BASE,{waitUntil:'networkidle',timeout:15000});
  const loadMs=Date.now()-start;
  assert(response && response.ok(), `${name}: page HTTP invalide`);
  initialLoaded=true;

  assert.equal(externalStartup.length,0,`${name}: appel Supabase/Stripe automatique au démarrage`);
  assert.equal(await page.evaluate(()=>window.SignalDealDiagnostics?.apiRequests),0,`${name}: compteur API non nul au démarrage`);
  assert.match(await page.locator('#startupStatus').innerText(),/0 appel API automatique/i);
  assert(loadMs < 8000,`${name}: chargement anormalement lent (${loadMs} ms)`);
  assert.equal(consoleErrors.length,0,`${name}: erreur console: ${consoleErrors.join(' | ')}`);
  assert.equal(pageErrors.length,0,`${name}: erreur JS: ${pageErrors.join(' | ')}`);

  // Les actions locales ne doivent jamais déclencher de réseau externe.
  let externalAfterBoot=0;
  page.on('request',req=>{ if(/supabase\.co|stripe\.com/i.test(req.url())) externalAfterBoot++; });
  await page.click('#selfTestBtn');
  await page.locator('#startupStatus').waitFor({state:'visible'});
  assert.match(await page.locator('#startupStatus').innerText(),/8\/8 réussis/i,`${name}: autotest local incomplet`);

  await page.click('#demoBtn');
  assert.equal(await page.locator('#total').innerText(),'6');
  assert.equal(await page.locator('#prospects').innerText(),'5');
  assert.equal(await page.locator('#competitors').innerText(),'1');
  assert.equal(await page.locator('#radiusStat').innerText(),'10 km');
  assert.equal(await page.locator('#feed .card').count(),6);
  assert.equal(await page.locator('#feed .competitor').count(),1);
  assert.equal(externalAfterBoot,0,`${name}: la simulation a déclenché un appel externe`);

  // Actions sans session : elles doivent être bloquées localement, sans réseau.
  await page.click('#searchBtn');
  assert.match(await page.locator('#searchStatus').innerText(),/Connectez-vous d’abord/i);
  await page.click('#pipelineBtn');
  assert.match(await page.locator('#pipeline').innerText(),/Connectez-vous d’abord/i);
  await page.locator('[data-buy="essential"]').click();
  assert.match(await page.locator('#authStatus').innerText(),/Connectez-vous avant de choisir/i);
  assert.equal(externalAfterBoot,0,`${name}: action bloquée a quand même déclenché du réseau`);

  // Validation formulaire locale : pas de requête si les identifiants sont invalides.
  await page.fill('#email','invalide');
  await page.fill('#password','123');
  await page.click('#loginBtn');
  assert.match(await page.locator('#authStatus').innerText(),/8 caractères minimum/i);
  assert.equal(externalAfterBoot,0,`${name}: login invalide a déclenché du réseau`);

  // Stress léger : répétitions de rendu, puis vérification de réactivité et de mémoire JS.
  for(let i=0;i<30;i++){
    await page.click('#demoBtn');
    if(i%5===0) await page.click('#selfTestBtn');
  }
  assert.equal(await page.locator('#feed .card').count(),6,`${name}: accumulation de cartes détectée`);
  const heap=await page.evaluate(()=>performance.memory?.usedJSHeapSize ?? 0);
  if(heap) assert(heap < 80*1024*1024,`${name}: mémoire JS trop élevée (${Math.round(heap/1024/1024)} Mo)`);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.evaluate(()=>window.SignalDealDiagnostics.apiRequests),0,`${name}: API appelée pendant stress local`);

  // Mode hors connexion : les fonctions locales doivent continuer à répondre.
  await context.setOffline(true);
  await page.click('#demoBtn');
  await page.click('#selfTestBtn');
  assert.match(await page.locator('#startupStatus').innerText(),/8\/8 réussis/i);
  assert.equal(await page.locator('#feed .card').count(),6);
  await context.setOffline(false);

  await browser.close();
  return {name,loadMs,heapMb:heap?Math.round(heap/1024/1024):null};
}

async function paymentReturnSmoke(){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();
  let external=0;
  page.on('request',r=>{if(/supabase\.co|stripe\.com/i.test(r.url())) external++;});
  await page.goto(BASE+'?payment=success',{waitUntil:'networkidle',timeout:15000});
  assert.equal(external,0,'Retour paiement : appel externe automatique détecté');
  assert.equal(await page.evaluate(()=>window.SignalDealDiagnostics.apiRequests),0);
  await page.locator('#paymentBanner').waitFor({state:'visible'});
  assert.match(await page.locator('#paymentBanner').innerText(),/Aucun contrôle automatique/i);
  await page.click('#checkPlanBtn');
  assert.match(await page.locator('#paymentBanner').innerText(),/Connectez-vous puis cliquez/i);
  assert.equal(external,0,'Retour paiement sans session : réseau déclenché après clic bloqué');
  await browser.close();
}

const desktop=await runViewport('desktop',{width:1440,height:900});
const mobile=await runViewport('mobile',{width:390,height:844});
await paymentReturnSmoke();
console.log('SMOKE PASS',JSON.stringify({desktop,mobile,paymentReturn:true}));
