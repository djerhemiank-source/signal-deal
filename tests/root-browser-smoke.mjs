import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE=process.env.SMOKE_BASE_URL||'http://127.0.0.1:4173/';
const PORTAL_URL='https://eazukvtjxeirbitukueb.supabase.co/functions/v1/signal-deal-billing-manager';
const DELETE_URL='https://eazukvtjxeirbitukueb.supabase.co/functions/v1/signal-deal-delete-account';
const SUPABASE_KEY='sb_publishable_OIOSgs39cGT6s34eVuexIA_5bZGmZVj';

async function checkBillingPortalSecurity(){
  const response=await fetch(PORTAL_URL,{
    method:'POST',
    headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
    body:'{}'
  });
  assert.equal(response.status,401,'billing portal: une requête sans session doit être refusée');
}

async function checkDeletionAndCompliance(){
  const response=await fetch(DELETE_URL,{
    method:'POST',
    headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({confirm:'DELETE_SIGNAL_DEAL_ACCOUNT'})
  });
  assert.equal(response.status,401,'suppression compte: une requête sans session doit être refusée');

  const privacy=await fetch(new URL('privacy.html',BASE));
  assert(privacy.ok,'politique de confidentialité inaccessible');
  const privacyText=await privacy.text();
  assert.match(privacyText,/Politique de confidentialité — Signal Deal/i);
  assert.match(privacyText,/Supprimer mon compte Signal Deal/i);

  const deletion=await fetch(new URL('delete-account.html',BASE));
  assert(deletion.ok,'page suppression de compte inaccessible');
  const deletionText=await deletion.text();
  assert.match(deletionText,/signal-deal-delete-account/);
  assert.match(deletionText,/Supprimer mon compte Signal Deal/i);
}

async function run(name,viewport){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text())) errors.push(m.text());});
  page.on('dialog',d=>d.dismiss());

  const start=Date.now();
  const response=await page.goto(BASE,{waitUntil:'networkidle',timeout:20000});
  const loadMs=Date.now()-start;
  assert(response?.ok(),name+': réponse HTTP invalide');
  assert(loadMs<10000,name+': chargement trop lent '+loadMs+' ms');
  assert.equal(errors.length,0,name+': erreurs '+errors.join(' | '));

  const diagnostics=await page.evaluate(()=>{
    const html=document.documentElement.innerHTML;
    const buttons=[...document.querySelectorAll('button')];
    return {
      controls:document.querySelectorAll('button,a').length,
      inert:buttons.filter(b=>!b.getAttribute('onclick')&&b.type!=='submit').map(b=>b.textContent.trim()),
      observers:/MutationObserver|setInterval|requestAnimationFrame/.test(html),
      brandHref:document.querySelector('.brand')?.getAttribute('href'),
      manageButton:Boolean(document.getElementById('manageSubscriptionBtn')),
      manageFunction:typeof manageSubscription==='function',
      stripeSecretExposed:/sk_(live|test)_/i.test(html)
    };
  });
  assert(diagnostics.controls>=15,name+': contrôles manquants ('+diagnostics.controls+')');
  assert.deepEqual(diagnostics.inert,[],name+': boutons sans action');
  assert.equal(diagnostics.observers,false,name+': boucle DOM/minuterie détectée');
  assert.equal(diagnostics.brandHref,'./',name+': lien accueil invalide');
  assert.equal(diagnostics.manageButton,true,name+': bouton de gestion abonnement absent');
  assert.equal(diagnostics.manageFunction,true,name+': action de gestion abonnement absente');
  assert.equal(diagnostics.stripeSecretExposed,false,name+': clé Stripe secrète exposée dans le navigateur');
  assert.equal(await page.evaluate(()=>/account_deletion_requests/.test(enterApp.toString())&&/completed/.test(enterApp.toString())),true,name+': verrou de compte supprimé absent');
  assert((await page.locator('a[href="./privacy.html"]').count())>0,name+': Privacy policy link missing');
  assert((await page.locator('a[href="./delete-account.html"]').count())>0,name+': Account deletion link missing');

  await page.locator('a[href="#pricing"]:visible').first().click();
  assert.equal(await page.evaluate(()=>location.hash),'#pricing');
  await page.locator('#authTop').click();
  assert.equal(await page.evaluate(()=>location.hash),'#authSection');

  await page.click('#signupTab');
  assert.match(await page.locator('#authSubmit').innerText(),/Créer mon compte/i);
  assert.equal(await page.locator('#nameField').evaluate(el=>getComputedStyle(el).display),'flex');
  await page.click('#loginTab');
  assert.match(await page.locator('#authSubmit').innerText(),/Se connecter/i);

  let authRequests=0;
  page.on('request',r=>{if(/supabase\.co\/auth\/v1/i.test(r.url())) authRequests++;});
  await page.fill('#email','invalide');
  await page.fill('#password','123');
  await page.click('#authSubmit');
  assert.match(await page.locator('#authMsg').innerText(),/8 caractères minimum/i);
  assert.equal(authRequests,0,name+': validation invalide a appelé Auth');

  for(const plan of ['essential','pro','agency']){
    await page.locator('button[onclick="startCheckout(\''+plan+'\')"]').click();
    assert.equal(authRequests,0,name+': paiement sans session a appelé Auth');
  }

  assert.equal(await page.evaluate(()=>/currentPlan\s*!==\s*'free'/.test(startCheckout.toString())),true,name+': garde anti-double-abonnement absente');
  let checkoutRequests=0;
  await page.route('https://buy.stripe.com/**',route=>{checkoutRequests++;route.abort();});
  const beforePaidGuard=page.url();
  await page.evaluate(()=>{session={user:{id:'qa-paid-user',email:'qa-paid@example.com'}};currentPlan='pro';startCheckout('agency')});
  await page.waitForTimeout(100);
  assert.equal(checkoutRequests,0,name+': un compte déjà payant a ouvert un nouveau Checkout Stripe');
  assert.equal(page.url(),beforePaidGuard,name+': un compte déjà payant a quitté Signal Deal vers un nouveau paiement');
  await page.evaluate(()=>{session=null;currentPlan='free'});

  assert.equal(await page.locator('#manageSubscriptionBtn').evaluate(el=>getComputedStyle(el).display),'none',name+': gestion abonnement visible sans formule payante');

  for(let i=0;i<30;i++){
    await page.click(i%2?'#signupTab':'#loginTab');
    await page.locator('a[href="#pricing"]:visible').first().click();
    await page.locator('#authTop').click();
  }
  const heap=await page.evaluate(()=>performance.memory?.usedJSHeapSize||0);
  if(heap) assert(heap<90*1024*1024,name+': mémoire excessive '+Math.round(heap/1024/1024)+' Mo');
  assert.equal(errors.length,0,name+': erreurs après stress '+errors.join(' | '));

  const playPage=await context.newPage();
  await playPage.goto(new URL('?platform=android-play',BASE).href,{waitUntil:'networkidle',timeout:20000});
  assert.equal(await playPage.evaluate(()=>IS_ANDROID_PLAY),true,name+': mode Android Play non détecté');
  assert.equal(await playPage.locator('.purchase-cta:visible').count(),0,name+': CTA Stripe visible dans la version Play');
  assert.equal(await playPage.locator('#manageSubscriptionBtn').isVisible(),false,name+': gestion Stripe visible dans la version Play');
  assert.equal(await playPage.locator('#changePlanBtn').isVisible(),false,name+': changement de formule visible dans la version Play');
  assert.match(await playPage.locator('#playStoreNotice').innerText(),/achats ne sont pas proposés/i);
  await playPage.close();

  await browser.close();
  return {name,loadMs,heapMb:heap?Math.round(heap/1024/1024):null,controls:diagnostics.controls};
}

await checkBillingPortalSecurity();
await checkDeletionAndCompliance();
const desktop=await run('desktop',{width:1440,height:900});
const mobile=await run('mobile',{width:390,height:844});
console.log('ROOT SMOKE PASS',JSON.stringify({desktop,mobile,billingPortalUnauthenticated:'blocked'}));
