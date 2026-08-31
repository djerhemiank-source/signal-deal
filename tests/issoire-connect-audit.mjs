import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE=process.env.IC_BASE||'http://127.0.0.1:4173/issoire-connect/';
async function closeAnyModal(page){await page.evaluate(()=>{try{if(typeof closeModal==='function')closeModal()}catch{};for(const el of document.querySelectorAll('.modalback,.modal')){try{el.classList.remove('show','open','active');el.style.display='none'}catch{}}}).catch(()=>{});await page.waitForTimeout(80)}
async function visibleText(page){const m=page.locator('.modalback:visible,.modal:visible');return await m.count()?await m.last().innerText():await page.locator('body').innerText()}

async function audit(viewport,label){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport,serviceWorkers:'block'});
 const page=await context.newPage();
 const pageErrors=[],failedRequests=[];
 page.on('pageerror',e=>pageErrors.push(String(e)));
 page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText||'failed'}));
 let r=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:20000});assert(r?.ok(),`${label}: landing HTTP`);assert.match(await page.title(),/Issoire Connect/i);
 r=await page.goto(new URL('app/index.html?audit='+Date.now(),BASE).href,{waitUntil:'domcontentloaded',timeout:20000});assert(r?.ok(),`${label}: app HTTP`);
 await page.locator('[data-page]').first().waitFor({state:'visible',timeout:20000});await page.waitForTimeout(1500);
 const bodyText=(await page.locator('body').innerText()).trim();assert(!/Erreur de chargement/i.test(bodyText),`${label}: V3 loader error`);assert(bodyText.length>150,`${label}: app rendered too little content`);
 const targets=await page.locator('[data-page]').evaluateAll(els=>[...new Set(els.map(e=>e.getAttribute('data-page')).filter(Boolean))]);assert(targets.length>=4,`${label}: too few navigation targets`);
 const pages=[];
 for(const target of targets){
  await closeAnyModal(page);const candidates=page.locator(`[data-page="${target}"]`);let clicked=false;
  for(let i=0;i<await candidates.count();i++){const el=candidates.nth(i);if(await el.isVisible().catch(()=>false)){try{await el.click({timeout:3500});clicked=true}catch{await closeAnyModal(page);try{await el.click({timeout:1500,force:true});clicked=true}catch{}};break}}
  if(!clicked){pages.push({target,visible:false});continue}await page.waitForTimeout(450);
  const main=page.locator('main'),text=(await main.innerText().catch(()=>'' )).trim();pages.push({target,visible:true,textLength:text.length,buttons:await main.locator('button').count().catch(()=>0),inputs:await main.locator('input,textarea,select').count().catch(()=>0),links:await main.locator('a').count().catch(()=>0),errorText:/erreur|impossible de charger|failed to fetch/i.test(text),sample:text.slice(0,180).replace(/\s+/g,' ')});await closeAnyModal(page)
 }
 await closeAnyModal(page);const searchCandidates=page.locator('[data-page="search"]');let searchNav=null;for(let i=0;i<await searchCandidates.count();i++){if(await searchCandidates.nth(i).isVisible().catch(()=>false)){searchNav=searchCandidates.nth(i);break}}
 if(searchNav){await searchNav.click({force:true});const q=page.locator('#globalQ');await q.waitFor({state:'visible',timeout:5000});await q.fill('boulangerie');const b=page.locator('.searchbar button').first();if(await b.count())await b.click({force:true});await page.waitForFunction(()=>document.querySelector('#searchOut')?.innerText.trim().length>0,null,{timeout:10000});assert.match(await page.locator('#searchOut').innerText(),/boulanger|commerce|résultat/i,`${label}: search failed`)}
 const [manifestOk,swOk]=await page.evaluate(async ([m,s])=>{const [mr,sr]=await Promise.all([fetch(m,{cache:'no-store'}),fetch(s,{cache:'no-store'})]);return[mr.ok,sr.ok]},[new URL('app/manifest.webmanifest',BASE).href,new URL('app/sw.js',BASE).href]);assert(manifestOk&&swOk,`${label}: PWA assets unavailable`);
 const g=await page.evaluate(()=>({state:typeof S!=='undefined',sb:typeof sb!=='undefined',go:typeof go,search:typeof window.runSearch,claim:typeof window.openClaimBusiness,edit:typeof window.openEditBusiness,follow:typeof window.toggleFollow,followPrefs:typeof window.openFollowPreferences,notifRead:typeof window.markNotificationRead,resident:typeof window.openResidentPreferences,geoOn:typeof window.enableLocalRadius,geoOff:typeof window.disableLocalRadius,visible:typeof visibleBusinesses,jobApply:typeof window.openJobApplication,jobSubmit:typeof window.submitJobApplication,jobStatus:typeof window.setJobApplicationStatus}));
 assert(g.state&&g.sb,`${label}: core state missing`);for(const [k,v] of Object.entries(g)){if(['state','sb'].includes(k))continue;assert.equal(v,'function',`${label}: ${k} missing`)}
 await closeAnyModal(page);const firstBusinessId=await page.evaluate(()=>Array.isArray(S?.businesses)&&S.businesses.length?S.businesses[0].id:null);if(firstBusinessId){await page.evaluate(id=>window.toggleFollow(id),firstBusinessId);await page.waitForTimeout(120);assert.match(await visibleText(page),/connect|compte|inscri/i,`${label}: follow must require auth`);await closeAnyModal(page)}
 await page.evaluate(()=>window.openResidentPreferences());await page.waitForTimeout(100);assert.match(await visibleText(page),/connect|compte|inscri/i,`${label}: resident prefs must require auth`);await closeAnyModal(page);
 const firstJobId=await page.evaluate(()=>Array.isArray(S?.jobs)&&S.jobs.length?S.jobs[0].id:null);if(firstJobId){await page.evaluate(id=>window.openJobApplication(id),firstJobId);await page.waitForTimeout(100);assert.match(await visibleText(page),/connect|compte|inscri/i,`${label}: job application must require auth`);await closeAnyModal(page)}
 assert.equal(pageErrors.length,0,`${label}: JS errors: ${pageErrors.join(' | ')}`);const severeFailed=failedRequests.filter(x=>!/(favicon|google|analytics|doubleclick)/i.test(x.url));await browser.close();return{label,targets,pages,globals:g,failedRequests:severeFailed.slice(0,20)}
}
const desktop=await audit({width:1440,height:900},'desktop');const mobile=await audit({width:390,height:844},'mobile');console.log('ISSOIRE CONNECT FUNCTION AUDIT PASS');console.log(JSON.stringify({base:BASE,desktop,mobile},null,2));
