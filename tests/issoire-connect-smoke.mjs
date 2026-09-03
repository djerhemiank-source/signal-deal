import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const BASE=process.env.IC_BASE||'http://127.0.0.1:4173/issoire-connect/';
const hasExactLegacyPrice=text=>text.split(/\r?\n/).some(line=>/^9,99 €(?:\s*\/\s*mois)?$/i.test(line.trim()));

async function run(viewport){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport,serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];let supabase=0;
 page.on('pageerror',err=>errors.push(String(err)));
 page.on('request',req=>{if(/supabase\.co/i.test(req.url()))supabase++});

 let r=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:20000});
 assert(r?.ok(),'landing HTTP');
 const landing=await page.locator('body').innerText();
 assert.match(landing,/0 €/);
 assert.match(landing,/4,99 €/);
 assert.match(landing,/19,99 €/);
 assert.equal(hasExactLegacyPrice(landing),false,'obsolete 9,99 plan visible');

 r=await page.goto(new URL('app/index.html?ci='+Date.now(),BASE).href,{waitUntil:'domcontentloaded',timeout:20000});
 assert(r?.ok(),'app HTTP');
 await page.locator('[data-page="search"]').waitFor({state:'visible',timeout:20000});
 await page.waitForFunction(()=>window.icV42?.version==='42.0'&&window.icAgenda?.version==='43.0'&&typeof window.openIcPlans==='function'&&typeof window.renderPublicClassifieds==='function',null,{timeout:20000});
 await page.waitForTimeout(400);

 let text=await page.locator('main').innerText();
 assert.match(text,/Tout Issoire/i,'home missing');
 assert.match(text,/Annonces & besoins/i,'unified publications shortcut missing');
 assert.match(text,/Mon agenda/i,'agenda shortcut missing');
 assert.doesNotMatch(text,/\bEntraide\b/i,'legacy duplicate Entraide visible');

 await page.evaluate(()=>go('agenda'));
 await page.waitForFunction(()=>/Mon agenda/i.test(document.querySelector('main')?.innerText||''),null,{timeout:10000});
 text=await page.locator('main').innerText();
 assert.match(text,/Agenda personnel privé|Vos rendez-vous personnels/i,'agenda screen missing');
 assert.match(text,/Connexion \/ inscription/i,'agenda login action missing');

 await page.evaluate(()=>go('classifieds'));
 await page.locator('#v42FeedQ').waitFor({state:'visible',timeout:20000});
 text=await page.locator('main').innerText();
 assert.match(text,/Annonces & besoins locaux/i,'unified publications page missing');
 assert.match(text,/Publier un besoin|🙋 Besoin/i,'publish need action missing');
 assert.match(text,/Déposer une annonce|➕ Annonce/i,'publish classified action missing');

 await page.evaluate(()=>openIcPlans());
 await page.locator('.modalback').waitFor({state:'visible',timeout:5000});
 const plans=await page.locator('#modalBody').innerText();
 assert.match(plans,/Pro Local/);assert.match(plans,/4,99 €/);
 assert.match(plans,/Pro 360/);assert.match(plans,/19,99 €/);
 assert.equal(hasExactLegacyPrice(plans),false,'obsolete 9,99 plan visible in app');
 await page.locator('.modalback').click();

 assert.equal(errors.length,0,errors.join(' | '));
 assert(supabase>=1,'Supabase connection missing');
 await browser.close();
 return {supabase};
}

const desktop=await run({width:1440,height:900});
const mobile=await run({width:390,height:844});
console.log('ISSOIRE CONNECT V43 SMOKE PASS',JSON.stringify({base:BASE,desktop,mobile}));
