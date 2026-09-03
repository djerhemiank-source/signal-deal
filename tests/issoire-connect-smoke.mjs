import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const BASE=process.env.IC_BASE||'http://127.0.0.1:4173/issoire-connect/';
const hasExactLegacyPrice=text=>text.split(/\r?\n/).some(line=>/^9,99 €(?:\s*\/\s*mois)?$/i.test(line.trim()));
async function run(viewport){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport,serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];let supabase=0;
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(/supabase\.co/i.test(r.url()))supabase++});
 let r=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:20000});assert(r?.ok(),'landing HTTP');
 assert.match(await page.title(),/Issoire Connect/);
 const landing=await page.locator('body').innerText();
 assert.match(landing,/0 €/,'Resident free price missing on landing');
 assert.match(landing,/4,99 €/,'Pro Local price missing on landing');
 assert.equal(hasExactLegacyPrice(landing),false,'Obsolete middle plan still visible on landing');
 assert.match(landing,/19,99 €/,'Pro 360 price missing on landing');
 assert.match(landing,/Paiements encore en mode test/i,'Stripe test mode warning missing');
 assert.match(landing,/ÊTRE TROUVÉ/i,'Pro Local positioning missing');
 assert.match(landing,/TROUVER DES CLIENTS/i,'Pro 360 positioning missing');

 const appUrl=new URL('app/index.html?ci='+Date.now(),BASE).href;
 r=await page.goto(appUrl,{waitUntil:'domcontentloaded',timeout:20000});assert(r?.ok(),'app HTTP');
 await page.locator('[data-page="search"]').waitFor({state:'visible',timeout:15000});
 await page.locator('.communitystats').waitFor({state:'visible',timeout:20000});
 assert.match(await page.locator('main').innerText(),/Tout Issoire/i,'home did not finish loading');
 await page.waitForFunction(()=>typeof window.renderDirectoryPage==='function'&&typeof window.openResidentAdForm==='function'&&typeof window.renderPublicClassifieds==='function'&&typeof window.openReportContent==='function'&&typeof window.openIcPlans==='function'&&typeof window.startIcPlanCheckout==='function'&&typeof window.icHasPro360==='function'&&window.icV42?.version==='42.0'&&window.icAgenda?.version==='43.0',null,{timeout:20000});

 const homeText=await page.locator('main').innerText();
 assert.match(homeText,/Annonces & besoins/i,'unified publications entry missing');
 assert.match(homeText,/Mon agenda/i,'personal agenda entry missing');
 assert.doesNotMatch(homeText,/\bEntraide\b/i,'legacy duplicate Entraide tile still visible');

 await page.evaluate(()=>go('agenda'));
 await page.waitForFunction(()=>/Mon agenda/i.test(document.querySelector('main')?.innerText||''),null,{timeout:10000});
 const agendaAnon=await page.locator('main').innerText();
 assert.match(agendaAnon,/Agenda personnel privé|Vos rendez-vous personnels/i,'agenda anonymous screen missing');
 assert.match(agendaAnon,/Connexion \/ inscription/i,'agenda login action missing');

 await page.evaluate(()=>go('home'));
 await page.evaluate(()=>openIcPlans());
 await page.locator('.modalback').waitFor({state:'visible',timeout:5000});
 const planText=await page.locator('#modalBody').innerText();
 assert.match(planText,/Pro Local/);
 assert.match(planText,/4,99 €/);
 assert.match(planText,/Pro 360/);
 assert.match(planText,/19,99 €/);
 assert.match(planText,/Radar Prospects/);
 assert.match(planText,/Tout est inclus|TOUT INCLUS/i);
 assert.equal(hasExactLegacyPrice(planText),false,'Obsolete middle plan still visible in app pricing');
 await page.locator('.modalback').click();

 await page.locator('[data-page="search"]').click();
 await page.locator('#globalQ').waitFor({state:'visible',timeout:5000});
 await page.locator('#globalQ').fill('boulangerie');
 await page.locator('.searchbar button').click();
 await page.waitForFunction(()=>document.querySelector('#searchOut')?.innerText.trim().length>0,null,{timeout:10000});
 assert.match(await page.locator('#searchOut').innerText(),/boulanger|commerce/i,'search did not render');
 const back=page.locator('#backBtn');assert(await back.isVisible(),'back button missing');
 await back.click();
 await page.waitForTimeout(250);

 await page.evaluate(()=>go('businesses'));
 await page.waitForFunction(()=>/Annuaire local d[’']Issoire/i.test(document.querySelector('main')?.innerText||'')&&!!document.querySelector('#dirJob'),null,{timeout:20000});
 await page.locator('#dirJob').fill('boulangerie');
 await page.locator('button',{hasText:'Filtrer'}).click();
 await page.waitForFunction(()=>{
   const input=document.querySelector('#dirJob');
   const text=document.querySelector('main')?.innerText||'';
   return input?.value==='boulangerie' && /boulanger/i.test(text);
 },null,{timeout:20000});
 await page.locator('#icMap').waitFor({state:'visible',timeout:20000});
 assert.match(await page.locator('main').innerText(),/boulanger/i,'directory filter did not return a bakery');

 await page.evaluate(()=>go('nearby'));
 await page.waitForFunction(()=>/Autour de moi/i.test(document.querySelector('main')?.innerText||'')&&!!document.querySelector('#icMap'),null,{timeout:20000});

 await page.evaluate(()=>go('classifieds'));
 await page.locator('#v42FeedQ').waitFor({state:'visible',timeout:20000});
 const feedText=await page.locator('main').innerText();
 assert.match(feedText,/Annonces & besoins locaux/i,'V42 unified publications page did not render');
 assert.match(feedText,/Publier un besoin|🙋 Besoin/i,'need publishing action missing');
 assert(await page.locator('button',{hasText:'Déposer une annonce'}).first().isVisible(),'classified deposit action missing');
 await page.locator('#v42FeedQ').fill('vélo');
 await page.locator('button',{hasText:'Filtrer'}).click();
 await page.locator('#v42FeedQ').waitFor({state:'visible',timeout:10000});
 await page.locator('button',{hasText:'Réinitialiser'}).click();
 await page.locator('#v42FeedQ').waitFor({state:'visible',timeout:10000});

 await page.locator('header button[title="Démonstration commerciale"]').click();
 await page.locator('.modalback').waitFor({state:'visible',timeout:5000});
 assert.match(await page.locator('#modalBody').innerText(),/démonstration entreprises/i);
 await page.locator('.modalback').click();
 assert(errors.length===0,errors.join(' | '));
 assert(supabase>=1,'App should connect to Supabase');
 await browser.close();return{supabase};
}
const desktop=await run({width:1440,height:900});
const mobile=await run({width:390,height:844});
console.log('ISSOIRE CONNECT V43 SMOKE PASS',JSON.stringify({base:BASE,desktop,mobile}));
