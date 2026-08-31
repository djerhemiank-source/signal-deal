'use strict';
const fs=require('fs');
const assert=require('assert');
const C=require('../lite/core.js');

let passed=0;
function test(name,fn){try{fn();passed++;console.log('PASS',name)}catch(e){console.error('FAIL',name,'-',e.message);process.exitCode=1}}

test('Gratuit: 5, sans détails/pipeline',()=>{const r=C.rights('free');assert.equal(r.max,5);assert.equal(r.radius,10);assert.equal(r.details,false);assert.equal(r.pipeline,false)});
test('Essentiel: 50, 10 km, détails + pipeline',()=>{const r=C.rights('essential');assert.equal(r.max,50);assert.equal(r.radius,10);assert.equal(r.details,true);assert.equal(r.pipeline,true);assert.equal(r.exportCsv,false)});
test('Pro: 250, 25 km, pipeline + CSV',()=>{const r=C.rights('pro');assert.equal(r.max,250);assert.equal(r.radius,25);assert.equal(r.pipeline,true);assert.equal(r.exportCsv,true)});
test('Agence: 500, 50 km, pipeline + CSV',()=>{const r=C.rights('agency');assert.equal(r.max,500);assert.equal(r.radius,50);assert.equal(r.pipeline,true);assert.equal(r.exportCsv,true)});
test('Plan inconnu retombe sur Gratuit',()=>assert.equal(C.plan('hacker'),'free'));
test('Rayon Essentiel plafonné à 10 km',()=>assert.equal(C.clampRadius('essential',50),10));
test('Rayon Pro plafonné à 25 km',()=>assert.equal(C.clampRadius('pro',50),25));
test('Rayon Agence plafonné à 50 km',()=>assert.equal(C.clampRadius('agency',50),50));
test('Résultats Essentiel plafonnés à 50',()=>assert.equal(C.capRows('essential',Array.from({length:100},(_,i)=>i)).length,50));
test('Imprimeur local détecté comme concurrent',()=>assert.equal(C.relation('Imprimerie / signalétique','18.12Z','Imprimerie / production graphique'),'competitor'));
test('Assurance détectée comme prospect pour imprimeur',()=>assert.equal(C.relation('Imprimerie / signalétique','66.22Z','Assurance / courtage'),'prospect'));
test('Boulangerie concurrente pour boulanger',()=>assert.equal(C.relation('Boulangerie','10.71C','Boulangerie / pâtisserie'),'competitor'));
test('Politique démarrage sans réseau auto/service worker/polling',()=>{const p=C.startupPolicy();assert.deepEqual(p,{automaticNetwork:false,serviceWorker:false,autoPolling:false,autoSessionRestore:false})});

const app=fs.readFileSync('lite/app.js','utf8');
const html=fs.readFileSync('lite/index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('lite/manifest.webmanifest','utf8'));

test('Aucune inscription de service worker dans Lite',()=>{assert(!/navigator\.serviceWorker/i.test(app));assert(!/serviceWorker\.register/i.test(app));assert(!/navigator\.serviceWorker/i.test(html));assert(!/serviceWorker\.register/i.test(html))});
test('Aucun setInterval/polling',()=>assert(!/setInterval\s*\(/.test(app)));
test('Aucune restauration asynchrone auto au chargement',()=>assert(!/\(async\s*\(\)\s*=>/.test(app)));
test('boot() ne fait aucun appel fetch/api',()=>{const m=app.match(/function boot\(\)\{([\s\S]*?)\}\nboot\(\);/);assert(m,'boot() introuvable');assert(!/\bfetch\s*\(/.test(m[1]));assert(!/\bapi\s*\(/.test(m[1]));assert(!/\bresume\s*\(/.test(m[1]));assert(!/\bloadPlan\s*\(/.test(m[1]))});
test('Retour paiement exige un clic de vérification',()=>{assert(/payment.*success/.test(app));assert(/checkPlanBtn/.test(app));const m=app.match(/function boot\(\)\{([\s\S]*?)\}\nboot\(\);/);assert(!/checkPlan\s*\(\)/.test(m[1]))});
test('Aucun script externe/CDN',()=>{const src=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(src,['core.js','app.js'])});
test('Manifest standalone valide',()=>{assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./')});

if(!process.exitCode) console.log(`\n${passed} tests réussis.`);
