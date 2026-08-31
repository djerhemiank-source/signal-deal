import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE=process.env.IC_BASE||'http://127.0.0.1:4173/issoire-connect/';

async function closeAnyModal(page){
  await page.evaluate(()=>{
    try{ if(typeof closeModal==='function') closeModal(); }catch{}
    for(const el of document.querySelectorAll('.modalback,.modal')){
      try{ el.classList.remove('show','open','active'); el.style.display='none'; }catch{}
    }
  }).catch(()=>{});
  await page.waitForTimeout(80);
}

async function audit(viewport,label){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  const page=await context.newPage();
  const pageErrors=[];
  const failedRequests=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText||'failed'}));

  let r=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:20000});
  assert(r?.ok(),`${label}: landing HTTP`);
  assert.match(await page.title(),/Issoire Connect/i,`${label}: landing title`);

  r=await page.goto(new URL('app/index.html?audit='+Date.now(),BASE).href,{waitUntil:'domcontentloaded',timeout:20000});
  assert(r?.ok(),`${label}: app HTTP`);
  await page.locator('[data-page]').first().waitFor({state:'visible',timeout:20000});
  await page.waitForTimeout(1500);

  const bodyText=(await page.locator('body').innerText()).trim();
  assert(!/Erreur de chargement/i.test(bodyText),`${label}: V3 loader error`);
  assert(bodyText.length>150,`${label}: app rendered too little content`);

  const targets=await page.locator('[data-page]').evaluateAll(els=>[...new Set(els.map(e=>e.getAttribute('data-page')).filter(Boolean))]);
  assert(targets.length>=4,`${label}: too few navigation targets: ${targets.join(',')}`);

  const pages=[];
  for(const target of targets){
    await closeAnyModal(page);
    const candidates=page.locator(`[data-page="${target}"]`);
    const count=await candidates.count();
    let clicked=false;
    for(let i=0;i<count;i++){
      const el=candidates.nth(i);
      if(await el.isVisible().catch(()=>false)){
        try{await el.click({timeout:3500});clicked=true}catch{await closeAnyModal(page);try{await el.click({timeout:1500,force:true});clicked=true}catch{}}
        break;
      }
    }
    if(!clicked){pages.push({target,visible:false});continue}
    await page.waitForTimeout(450);
    const modalVisible=await page.locator('.modalback.show,.modal.show,.modalback:visible,.modal:visible').count().catch(()=>0);
    const main=page.locator('main');
    const text=(await main.innerText().catch(()=>'' )).trim();
    pages.push({target,visible:true,textLength:text.length,buttons:await main.locator('button').count().catch(()=>0),inputs:await main.locator('input,textarea,select').count().catch(()=>0),links:await main.locator('a').count().catch(()=>0),errorText:/erreur|impossible de charger|failed to fetch/i.test(text),modalVisible:Boolean(modalVisible),sample:text.slice(0,180).replace(/\s+/g,' ')});
    await closeAnyModal(page);
  }

  await closeAnyModal(page);
  const searchCandidates=page.locator('[data-page="search"]');
  let searchNav=null;
  for(let i=0;i<await searchCandidates.count();i++){if(await searchCandidates.nth(i).isVisible().catch(()=>false)){searchNav=searchCandidates.nth(i);break}}
  if(searchNav){
    await searchNav.click({timeout:5000,force:true});
    const q=page.locator('#globalQ');await q.waitFor({state:'visible',timeout:5000});await q.fill('boulangerie');
    const searchBtn=page.locator('.searchbar button').first();if(await searchBtn.count())await searchBtn.click({force:true});
    await page.waitForFunction(()=>document.querySelector('#searchOut')?.innerText.trim().length>0,null,{timeout:10000});
    assert.match(await page.locator('#searchOut').innerText(),/boulanger|commerce|résultat/i,`${label}: search did not return understandable output`);
  }

  const [manifestOk,swOk]=await page.evaluate(async ([m,s])=>{const [mr,sr]=await Promise.all([fetch(m,{cache:'no-store'}),fetch(s,{cache:'no-store'})]);return [mr.ok,sr.ok]},[new URL('app/manifest.webmanifest',BASE).href,new URL('app/sw.js',BASE).href]);
  assert(manifestOk,`${label}: manifest unavailable`);assert(swOk,`${label}: service worker unavailable`);

  const globals=await page.evaluate(()=>({
    hasState:typeof S!=='undefined',hasSupabase:typeof sb!=='undefined',go:typeof go,authModal:typeof authModal,proAccount:typeof proAccount,accountPage:typeof accountPage,
    runSearch:typeof window.runSearch,claim:typeof window.openClaimBusiness,editBusiness:typeof window.openEditBusiness,
    toggleFollow:typeof window.toggleFollow,followPrefs:typeof window.openFollowPreferences,saveFollowPrefs:typeof window.saveFollowPreferences,markNotificationRead:typeof window.markNotificationRead,
    residentPrefs:typeof window.openResidentPreferences,saveResidentPrefs:typeof window.saveResidentPreferences,enableLocalRadius:typeof window.enableLocalRadius,disableLocalRadius:typeof window.disableLocalRadius,visibleBusinesses:typeof visibleBusinesses
  }));
  assert(globals.hasState,`${label}: state S missing`);assert(globals.hasSupabase,`${label}: Supabase client missing`);assert.equal(globals.go,'function',`${label}: go() missing`);assert.equal(globals.runSearch,'function',`${label}: robust search patch missing`);assert.equal(globals.claim,'function',`${label}: business claim module missing`);assert.equal(globals.editBusiness,'function',`${label}: business edit module missing`);assert.equal(globals.toggleFollow,'function',`${label}: follow module missing`);assert.equal(globals.followPrefs,'function',`${label}: follow preferences missing`);assert.equal(globals.saveFollowPrefs,'function',`${label}: follow preferences save missing`);assert.equal(globals.markNotificationRead,'function',`${label}: notification read action missing`);assert.equal(globals.residentPrefs,'function',`${label}: resident preferences missing`);assert.equal(globals.saveResidentPrefs,'function',`${label}: resident preferences save missing`);assert.equal(globals.enableLocalRadius,'function',`${label}: device geolocation activation missing`);assert.equal(globals.disableLocalRadius,'function',`${label}: device geolocation disable missing`);assert.equal(globals.visibleBusinesses,'function',`${label}: local-radius business filter missing`);

  // Logged-out follow action must ask for authentication and never write data.
  await closeAnyModal(page);
  const firstBusinessId=await page.evaluate(()=>Array.isArray(S?.businesses)&&S.businesses.length?S.businesses[0].id:null);
  if(firstBusinessId){
    await page.evaluate(id=>window.toggleFollow(id),firstBusinessId);
    await page.waitForTimeout(150);
    const modalLocator=page.locator('.modalback:visible,.modal:visible');
    const modalText=await modalLocator.count()?await modalLocator.last().innerText():await page.locator('body').innerText();
    assert.match(modalText,/connect|compte|inscri/i,`${label}: logged-out follow should request authentication`);
    await closeAnyModal(page);
  }

  // Resident preferences must also stay behind authentication.
  await page.evaluate(()=>window.openResidentPreferences());
  await page.waitForTimeout(100);
  const authModalLocator=page.locator('.modalback:visible,.modal:visible');
  const authText=await authModalLocator.count()?await authModalLocator.last().innerText():await page.locator('body').innerText();
  assert.match(authText,/connect|compte|inscri/i,`${label}: resident preferences should request authentication when logged out`);
  await closeAnyModal(page);

  const severeFailed=failedRequests.filter(x=>!/(favicon|google|analytics|doubleclick)/i.test(x.url));
  assert.equal(pageErrors.length,0,`${label}: JS errors: ${pageErrors.join(' | ')}`);
  await browser.close();
  return {label,targets,pages,globals,failedRequests:severeFailed.slice(0,20)};
}

const desktop=await audit({width:1440,height:900},'desktop');
const mobile=await audit({width:390,height:844},'mobile');
console.log('ISSOIRE CONNECT FUNCTION AUDIT PASS');
console.log(JSON.stringify({base:BASE,desktop,mobile},null,2));
