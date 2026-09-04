import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const APP=process.env.IC_APP||'https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const ORDER='00000000-0000-4000-8000-000000000501';
const NOTIFICATION='00000000-0000-4000-8000-000000000502';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

try{
  await page.goto(APP+`?v50-e2e=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.icV50?.version==='50.0'&&window.icV49?.version==='49.0'&&window.icV48?.version==='48.0',null,{timeout:25000});
  console.log('PASS V50 module loaded');

  await page.evaluate(({notification})=>{
    S.session={user:{id:'00000000-0000-4000-8000-000000000599'}};
    S.page='account';
    window.__v50RpcCalls=[];
    window.__v50FunctionCalls=[];
    window.__v50OriginalRpc=sb.rpc.bind(sb);
    window.__v50OriginalInvoke=sb.functions.invoke.bind(sb.functions);
    sb.rpc=async function(name,args){
      window.__v50RpcCalls.push({name,args});
      if(name==='ic_set_order_status_v50')return {data:notification,error:null};
      return {data:[],error:null};
    };
    sb.functions.invoke=async function(name,options){
      window.__v50FunctionCalls.push({name,options});
      if(name==='ic-send-order-notification-push')return {data:{sent:1,failed:0,status:'sent'},error:null};
      return window.__v50OriginalInvoke(name,options);
    };
    window.loadPrivate=async()=>{};
    window.render=()=>{};
    window.say=msg=>{window.__v50LastSay=msg};
  },{notification:NOTIFICATION});

  await page.evaluate(order=>setOrder(order,'ready'),ORDER);
  await page.waitForFunction(()=>window.__v50RpcCalls.some(x=>x.name==='ic_set_order_status_v50'),null,{timeout:5000});
  const rpcCall=await page.evaluate(()=>window.__v50RpcCalls.find(x=>x.name==='ic_set_order_status_v50'));
  assert.deepEqual(rpcCall.args,{p_order_id:ORDER,p_status:'ready'});

  await page.waitForFunction(()=>window.__v50FunctionCalls.some(x=>x.name==='ic-send-order-notification-push'),null,{timeout:5000});
  const functionCall=await page.evaluate(()=>window.__v50FunctionCalls.find(x=>x.name==='ic-send-order-notification-push'));
  assert.equal(functionCall.options.body.notification_id,NOTIFICATION);
  console.log('PASS secure status -> exact notification -> Push function');

  const deep=await page.evaluate(order=>{
    history.replaceState({},'',location.pathname+`?notification=order&id=${order}`);
    return icV50.deepLink();
  },ORDER);
  assert.equal(deep.orderId,ORDER);
  console.log('PASS Push deep-link parsing');

  await page.evaluate(()=>{
    window.__v50Focused=null;
    icV48.focusOrder=async id=>{window.__v50Focused=id;return true};
  });
  await page.evaluate(()=>icV50.handleOrderDeepLink());
  await page.waitForFunction(()=>window.__v50Focused!==null,null,{timeout:5000});
  const focused=await page.evaluate(()=>window.__v50Focused);
  assert.equal(focused,ORDER);
  const remaining=await page.evaluate(()=>location.search);
  assert.equal(remaining,'');
  console.log('PASS Push click opens transaction and clears one-shot URL');

  await page.evaluate(({order,notification})=>{
    window.__v50FunctionCalls.length=0;
    sb.functions.invoke=async function(name,options){
      window.__v50FunctionCalls.push({name,options});
      if(name==='ic-send-order-notification-push')return {data:null,error:new Error('push unavailable')};
      return window.__v50OriginalInvoke(name,options);
    };
    return setOrder(order,'completed');
  },{order:ORDER,notification:NOTIFICATION});
  const lastSay=await page.evaluate(()=>window.__v50LastSay||'');
  assert.match(lastSay,/Statut : Terminée/i);
  console.log('PASS Push failure does not roll back business status UX');

  assert.equal(pageErrors.length,0,'Page errors: '+pageErrors.join(' | '));
  console.log('ISSOIRE CONNECT V50 ORDER PUSH E2E PASS');
} finally {
  await context.close();
  await browser.close();
}
