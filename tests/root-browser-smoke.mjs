import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE=process.env.SMOKE_BASE_URL||'http://127.0.0.1:4173/';

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
      brandHref:document.querySelector('.brand')?.getAttribute('href')
    };
  });
  assert(diagnostics.controls>=15,name+': contrôles manquants ('+diagnostics.controls+')');
  assert.deepEqual(diagnostics.inert,[],name+': boutons sans action');
  assert.equal(diagnostics.observers,false,name+': boucle DOM/minuterie détectée');
  assert.equal(diagnostics.brandHref,'./',name+': lien accueil invalide');

  await page.locator('a[href="#pricing"]').first().click();
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

  for(let i=0;i<30;i++){
    await page.click(i%2?'#signupTab':'#loginTab');
    await page.locator('a[href="#pricing"]').first().click();
    await page.locator('#authTop').click();
  }
  const heap=await page.evaluate(()=>performance.memory?.usedJSHeapSize||0);
  if(heap) assert(heap<90*1024*1024,name+': mémoire excessive '+Math.round(heap/1024/1024)+' Mo');
  assert.equal(errors.length,0,name+': erreurs après stress '+errors.join(' | '));
  await browser.close();
  return {name,loadMs,heapMb:heap?Math.round(heap/1024/1024):null,controls:diagnostics.controls};
}

const desktop=await run('desktop',{width:1440,height:900});
const mobile=await run('mobile',{width:390,height:844});
console.log('ROOT SMOKE PASS',JSON.stringify({desktop,mobile}));
