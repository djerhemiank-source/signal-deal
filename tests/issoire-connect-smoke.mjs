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
 assert.equal(supabase,0,'landing must not call Supabase');
 const appUrl=new URL('app/index.html?ci='+Date.now(),BASE).href;
 r=await page.goto(appUrl,{waitUntil:'domcontentloaded',timeout:20000});assert(r?.ok(),'app HTTP');
 assert.equal(supabase,0,'app startup must not call Supabase');
 const html=await page.content();
 if(!html.includes('Aucun chargement automatique')&&!html.includes('Aucune donnée n’est chargée')){
   console.error('APP_DIAG',JSON.stringify({requested:appUrl,finalUrl:page.url(),title:await page.title(),status:r?.status(),html:html.slice(0,1200)}));
   throw new Error('The lightweight app marker is missing from the HTML received by Chromium');
 }
 const status=page.locator('#status');
 await status.waitFor({state:'attached',timeout:5000});
 assert.match(await status.innerText(),/Aucune donnée n’est chargée/i);
 await page.locator('[data-view="businesses"]').first().click();
 await page.locator('#out .card').first().waitFor({state:'visible',timeout:10000});
 const businesses=await page.locator('#out .card').count(); assert(businesses>=1,'businesses empty');
 const afterBusinesses=supabase;assert(afterBusinesses===1,`expected 1 Supabase request, got ${afterBusinesses}`);
 await page.locator('[data-view="offers"]').first().click();await page.locator('#out .card').first().waitFor({state:'visible',timeout:10000});assert(await page.locator('#out .card').count()>=1,'offers empty');
 await page.locator('[data-view="jobs"]').click();await page.locator('#out .card').first().waitFor({state:'visible',timeout:10000});assert(await page.locator('#out .card').count()>=1,'jobs empty');
 await page.locator('[data-view="events"]').click();await page.locator('#out .card').first().waitFor({state:'visible',timeout:10000});assert(await page.locator('#out .card').count()>=1,'events empty');
 assert.equal(errors.length,0,errors.join(' | '));
 await browser.close();return{businesses,supabase};
}
const desktop=await run({width:1440,height:900});
const mobile=await run({width:390,height:844});
console.log('ISSOIRE CONNECT SMOKE PASS',JSON.stringify({base:BASE,desktop,mobile}));
