(()=>{
if(typeof window==='undefined'||typeof sb==='undefined')return;

const PRIMARY_APP_URL='https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/index.html';
const PENDING_EMAIL_KEY='ic_pending_confirmation_email';
const RESEND_UNTIL_KEY='ic_confirmation_resend_until';
let mode='login';
let nextPage='account';

const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const q=id=>document.getElementById(id);
function redirectUrl(){
 try{
  if(location.hostname==='djerhemiank-source.github.io')return PRIMARY_APP_URL;
  return location.origin+location.pathname;
 }catch{return PRIMARY_APP_URL}
}
function pendingEmail(){try{return localStorage.getItem(PENDING_EMAIL_KEY)||''}catch{return ''}}
function setPendingEmail(email){try{localStorage.setItem(PENDING_EMAIL_KEY,email||'')}catch{}}
function clearPending(){try{localStorage.removeItem(PENDING_EMAIL_KEY);localStorage.removeItem(RESEND_UNTIL_KEY)}catch{}}
function resendUntil(){try{return Number(localStorage.getItem(RESEND_UNTIL_KEY)||0)}catch{return 0}}
function setResendCooldown(ms=60000){try{localStorage.setItem(RESEND_UNTIL_KEY,String(Date.now()+ms))}catch{}}
function secondsLeft(){return Math.max(0,Math.ceil((resendUntil()-Date.now())/1000))}
function friendlyError(err){
 const code=String(err?.code||'').toLowerCase(),msg=String(err?.message||'').toLowerCase();
 if(code==='email_not_confirmed'||msg.includes('email not confirmed'))return 'Votre compte existe, mais votre adresse email n’est pas encore confirmée.';
 if(code==='invalid_credentials'||msg.includes('invalid login credentials'))return 'Email ou mot de passe incorrect.';
 if(code==='over_email_send_rate_limit'||msg.includes('security purposes')||msg.includes('rate limit'))return 'Un email vient déjà d’être envoyé. Attendez environ une minute avant d’en demander un autre.';
 if(code==='user_already_exists'||msg.includes('already registered'))return 'Un compte existe déjà avec cette adresse email. Utilisez Connexion ou Mot de passe oublié.';
 return err?.message||'La connexion a échoué.';
}
function setInfo(html){const n=q('authInfo');if(n)n.innerHTML=html}
function updateResendButton(){
 const btn=q('icResendConfirm');if(!btn)return;
 const left=secondsLeft();btn.disabled=left>0;btn.textContent=left>0?`Renvoyer l’email dans ${left} s`:'Renvoyer l’email de confirmation';
 if(left>0)setTimeout(updateResendButton,1000);
}
function confirmationPanel(email,message=''){return `<div class="notice" style="margin-top:8px"><b>✉️ Confirmez votre adresse email</b><br>${message?e(message)+'<br>':''}Nous avons envoyé un email à <b>${e(email)}</b>.<br><br><b>Important :</b> ouvrez le <u>dernier email reçu</u>. Les anciens liens peuvent devenir invalides après un nouvel envoi.</div><div class="actions" style="margin-top:10px"><button id="icResendConfirm" type="button" class="btn" onclick="resendIcSignupConfirmation()">Renvoyer l’email de confirmation</button><button type="button" class="btn" onclick="authMode('login')">J’ai confirmé mon email</button></div>`}
function showPending(email,message=''){
 setPendingEmail(email);setInfo(confirmationPanel(email,message));updateResendButton();
}

window.authModal=function(next='account'){
 nextPage=next||'account';mode='login';
 const pe=pendingEmail();
 openModal(`<h2>Connexion à Issoire Connect</h2><div class="tabs"><button id="loginTab" class="active" onclick="authMode('login')">Connexion</button><button id="signupTab" onclick="authMode('signup')">Créer un compte</button></div><div class="form"><div id="nameWrap" style="display:none"><label>Nom</label><input id="authName" autocomplete="name"></div><label>Email</label><input id="authEmail" type="email" autocomplete="email" value="${e(pe)}"><label>Mot de passe</label><input id="authPass" type="password" autocomplete="current-password" placeholder="8 caractères minimum"><button id="authGo" class="btn brand" onclick="doAuth()">Se connecter</button><button type="button" class="btn" onclick="openIcPasswordReset(document.getElementById('authEmail')?.value||'')">Mot de passe oublié ?</button><div id="authInfo" class="muted">${pe?confirmationPanel(pe):'Connectez-vous à votre compte.'}</div></div>`);
 updateResendButton();
};

window.authMode=function(m){
 mode=m==='signup'?'signup':'login';
 q('loginTab')?.classList.toggle('active',mode==='login');q('signupTab')?.classList.toggle('active',mode==='signup');
 const name=q('nameWrap'),pass=q('authPass'),go=q('authGo');if(name)name.style.display=mode==='signup'?'block':'none';
 if(pass)pass.autocomplete=mode==='signup'?'new-password':'current-password';
 if(go)go.textContent=mode==='signup'?'Créer mon compte':'Se connecter';
 setInfo(mode==='signup'?'Compte habitant gratuit. Vous pourrez activer ensuite votre espace professionnel sur ce même compte.':'Connectez-vous à votre compte.');
};

window.resendIcSignupConfirmation=async function(){
 const email=(q('authEmail')?.value||pendingEmail()).trim();if(!email||!email.includes('@'))return say('Indiquez votre adresse email.');
 const left=secondsLeft();if(left>0){updateResendButton();return say(`Attendez encore ${left} seconde(s).`)}
 const btn=q('icResendConfirm');if(btn){btn.disabled=true;btn.textContent='Envoi…'}
 const {error}=await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectUrl()}});
 if(error){if(btn)btn.disabled=false;setInfo(confirmationPanel(email,friendlyError(error)));updateResendButton();return say(friendlyError(error))}
 setPendingEmail(email);setResendCooldown();setInfo(confirmationPanel(email,'Un nouvel email vient d’être envoyé.'));updateResendButton();say('Email de confirmation renvoyé.');
};

window.doAuth=async function(){
 const email=(q('authEmail')?.value||'').trim(),password=q('authPass')?.value||'';
 if(!email||!email.includes('@')||password.length<8)return say('Email valide et mot de passe de 8 caractères minimum.');
 const btn=q('authGo');if(btn){btn.disabled=true;btn.textContent=mode==='signup'?'Création…':'Connexion…'}
 try{
  let r;
  if(mode==='signup'){
   const name=(q('authName')?.value||'').trim();
   r=await sb.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl(),data:{display_name:name,role:'resident'}}});
  }else r=await sb.auth.signInWithPassword({email,password});
  if(r.error){
   const msg=friendlyError(r.error);
   if(String(r.error.code||'').toLowerCase()==='email_not_confirmed'||String(r.error.message||'').toLowerCase().includes('email not confirmed')){showPending(email,msg);return}
   setInfo(`<span style="color:#b42318">${e(msg)}</span>`);say(msg);return;
  }
  if(!r.data?.session){setResendCooldown();showPending(email,'Votre compte a été créé.');say('Compte créé : confirmez maintenant votre email.');return}
  clearPending();S.session=r.data.session;closeModal();if(typeof loadPrivate==='function')await loadPrivate();say('Connecté');if(typeof go==='function')go(nextPage||'account');
 }finally{if(btn){btn.disabled=false;btn.textContent=mode==='signup'?'Créer mon compte':'Se connecter'}}
};

try{
 sb.auth.onAuthStateChange(async(event,session)=>{
  if(event==='SIGNED_IN'&&session){
   clearPending();
   const fromEmail=location.hash.includes('access_token')||location.hash.includes('type=signup')||/[?&](code|token_hash)=/.test(location.search);
   if(fromEmail){
    try{S.session=session;if(typeof loadPrivate==='function')await loadPrivate();if(typeof closeModal==='function')closeModal();if(typeof go==='function')go('account');if(typeof say==='function')say('Email confirmé. Bienvenue sur Issoire Connect.');history.replaceState(null,document.title,location.pathname)}catch{}
   }
  }
 });
}catch{}

// If Supabase redirected an auth error back to the app, show a useful message instead of leaving the user on a broken-looking page.
setTimeout(()=>{
 try{
  const p=new URLSearchParams(location.hash.replace(/^#/,''));const code=p.get('error_code')||'';const desc=p.get('error_description')||'';
  if(code||desc){authModal('account');setInfo(`<div class="notice"><b>Le lien de confirmation n’est plus valable.</b><br>${e(desc||'Utilisez le dernier email de confirmation reçu, ou demandez-en un nouveau ci-dessus.')}</div>${pendingEmail()?confirmationPanel(pendingEmail()):''}`);updateResendButton()}
 }catch{}
},500);
})();
