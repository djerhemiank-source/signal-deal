import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const APP=process.env.IC_APP||'http://127.0.0.1:4173/issoire-connect/app/index.html';
const browser=await chromium.launch({headless:true});

try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(APP+'?shared-link-test=1',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('[data-page="account"]').waitFor({state:'visible',timeout:20000});
  await page.locator('[data-page="account"]').click();
  await page.locator('button',{hasText:'Connexion / inscription'}).click();
  await page.locator('#signupTab').click();

  assert.equal(await page.locator('#roleWrap').count(),0,'Le nouveau compte ne doit plus demander un rôle exclusif habitant/pro.');

  await page.evaluate(()=>{
    globalThis.__icCapturedSignup=null;
    sb.auth.signUp=async payload=>{globalThis.__icCapturedSignup=payload;return {data:{user:{id:'fake-user'},session:null},error:null}};
  });
  await page.locator('#authName').fill('Nouveau membre');
  await page.locator('#authEmail').fill('nouveau-membre@example.com');
  await page.locator('#authPass').fill('MotDePasseTest123!');
  await page.locator('#authGo').click();
  await page.getByText('Confirmez votre adresse email').waitFor({state:'visible',timeout:10000});

  const signup=await page.evaluate(()=>globalThis.__icCapturedSignup);
  assert.equal(signup?.options?.data?.role,'resident','Le compte initial doit être habitant, avec Pro ajouté ensuite.');
  assert(signup?.options?.emailRedirectTo,'emailRedirectTo manquant');
  assert(signup.options.emailRedirectTo.includes('/issoire-connect/app/index.html'),'La confirmation doit revenir sur l’application Issoire Connect.');
  assert.equal(await page.locator('#icResendConfirm').count(),1,'Bouton de renvoi de confirmation manquant.');
  console.log('PASS signup confirmation redirect',signup.options.emailRedirectTo);

  await page.locator('button',{hasText:'J’ai confirmé mon email'}).click();
  await page.evaluate(()=>{
    sb.auth.signInWithPassword=async()=>({data:{session:null},error:{code:'email_not_confirmed',message:'Email not confirmed'}});
  });
  await page.locator('#authEmail').fill('nouveau-membre@example.com');
  await page.locator('#authPass').fill('MotDePasseTest123!');
  await page.locator('#authGo').click();
  await page.getByText('Votre compte existe, mais votre adresse email n’est pas encore confirmée.').waitFor({state:'visible',timeout:10000});
  console.log('PASS friendly email-not-confirmed flow');

  await page.evaluate(()=>{
    localStorage.setItem('ic_confirmation_resend_until','0');
    globalThis.__icCapturedResend=null;
    sb.auth.resend=async payload=>{globalThis.__icCapturedResend=payload;return {data:{},error:null}};
    const b=document.getElementById('icResendConfirm');if(b){b.disabled=false;b.click()}
  });
  await page.waitForFunction(()=>!!globalThis.__icCapturedResend,null,{timeout:5000});
  const resend=await page.evaluate(()=>globalThis.__icCapturedResend);
  assert.equal(resend?.type,'signup');
  assert(resend?.options?.emailRedirectTo?.includes('/issoire-connect/app/index.html'),'Le renvoi doit utiliser le bon retour Issoire Connect.');
  console.log('PASS resend confirmation redirect');
  assert.equal(errors.length,0,'Page errors: '+errors.join(' | '));
  await context.close();

  const fallbackContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await fallbackContext.addInitScript(()=>{try{delete window.DecompressionStream}catch{};try{Object.defineProperty(window,'DecompressionStream',{value:undefined,configurable:true})}catch{}});
  const fallback=await fallbackContext.newPage();
  await fallback.goto(APP+'?fallback-test=1',{waitUntil:'domcontentloaded',timeout:30000});
  await fallback.waitForURL(/\/issoire-connect\/app-clean\/index\.html/,{timeout:10000});
  console.log('PASS legacy/in-app browser fallback',fallback.url());
  await fallbackContext.close();

  console.log('ISSOIRE CONNECT SHARED LINK AUTH E2E PASS');
} finally {
  await browser.close();
}
