import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const BASE=process.env.IC_BASE||'http://127.0.0.1:4173/issoire-connect/';
async function run(viewport){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport,serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];let supabase=0;
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(/supabase\.co/i.test(r.url()))supabase++});
 let r=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:20000});assert(r?.ok(),'landing HTTP');
 assert.match(await page.title(),/Issoire Connect/);
 const appUrl=new URL('app/index.html?ci='+Date.now(),BASE).href;
 r=await page.goto(appUrl,{waitUntil:'domcontentloaded',timeout:20000});assert(r?.ok(),'app HTTP');
 await page.locator('[data-page="search"]').waitFor({state:'visible',timeout:15000});
 await page.locator('.communitystats').waitFor({state:'visible',timeout:20000});
 assert.match(await page.locator('main').innerText(),/Tout Issoire/i,'home did not finish loading');
 assert(await page.evaluate(()=>typeof window.renderDirectoryPage==='function'),'directory module missing');
 assert(await page.evaluate(()=>typeof window.openResidentAdForm==='function'),'resident classifieds module missing');
 assert(await page.evaluate(()=>typeof window.renderPublicClassifieds==='function'),'public classifieds module missing');
 assert(await page.evaluate(()=>typeof window.openClassifiedContact==='function'),'classified contact flow missing');

 await page.locator('[data-page="search"]').click();
 await page.locator('#globalQ').waitFor({state:'visible',timeout:5000});
 await page.locator('#globalQ').fill('boulangerie');
 await page.locator('.searchbar button').click();
 await page.waitForFunction(()=>document.querySelector('#searchOut')?.innerText.trim().length>0,null,{timeout:10000});
 const searchText=await page.locator('#searchOut').innerText();
 assert.match(searchText,/boulanger|commerce/i,'search did not render');
 const back=page.locator('#backBtn');assert(await back.isVisible(),'back button missing');
 await back.click();
 await page.waitForTimeout(250);

 await page.evaluate(()=>go('businesses'));
 await page.locator('#dirJob').waitFor({state:'visible',timeout:20000});
 assert.match(await page.locator('main').innerText(),/Annuaire local d’Issoire/i,'directory did not render');
 await page.locator('#dirJob').fill('boulangerie');
 await page.locator('button', {hasText:'Filtrer'}).click();
 await page.locator('#icMap').waitFor({state:'visible',timeout:20000});
 await page.waitForFunction(()=>document.querySelectorAll('main article.card').length>0,null,{timeout:20000});
 const directoryText=await page.locator('main').innerText();
 assert.match(directoryText,/boulanger/i,'directory filter did not return a bakery');

 await page.evaluate(()=>go('nearby'));
 await page.locator('#icMap').waitFor({state:'visible',timeout:20000});
 await page.waitForFunction(()=>/Autour de moi/i.test(document.querySelector('main')?.innerText||''),null,{timeout:20000});

 await page.evaluate(()=>go('classifieds'));
 await page.locator('#caQ').waitFor({state:'visible',timeout:20000});
 assert.match(await page.locator('main').innerText(),/Petites annonces locales/i,'public classifieds did not render');
 await page.locator('#caQ').fill('vélo');
 await page.locator('button',{hasText:'Filtrer'}).click();
 await page.locator('#caQ').waitFor({state:'visible',timeout:10000});
 assert(await page.locator('button',{hasText:'Déposer'}).first().isVisible(),'classified deposit action missing');

 await page.locator('header button[title="Démonstration commerciale"]').click();
 await page.locator('.modalback').waitFor({state:'visible',timeout:5000});
 assert.match(await page.locator('#modalBody').innerText(),/démonstration entreprises/i);
 await page.locator('.modalback').click();
 assert(errors.length===0,errors.join(' | '));
 assert(supabase>=1,'V3 should connect to Supabase');
 await browser.close();return{supabase};
}
const desktop=await run({width:1440,height:900});
const mobile=await run({width:390,height:844});
console.log('ISSOIRE CONNECT V16 SMOKE PASS',JSON.stringify({base:BASE,desktop,mobile}));
