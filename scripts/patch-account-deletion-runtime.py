from pathlib import Path

index=Path('index.html')
s=index.read_text(encoding='utf-8')
old="async function enterApp(){if(!session)return;document.getElementById('dashboard').classList.add('show');"
new="async function enterApp(){if(!session)return;const {data:deletionState}=await client.from('account_deletion_requests').select('status').eq('user_id',session.user.id).maybeSingle();if(deletionState?.status==='completed'){await client.auth.signOut({scope:'local'});session=null;alert('Ce compte Signal Deal a été supprimé.');location.href=PUBLIC_URL;return}document.getElementById('dashboard').classList.add('show');"
if old not in s and new not in s:
    raise SystemExit('enterApp marker not found')
s=s.replace(old,new)
index.write_text(s,encoding='utf-8')

test=Path('tests/root-browser-smoke.mjs')
t=test.read_text(encoding='utf-8')
old_const="const PORTAL_URL='https://eazukvtjxeirbitukueb.supabase.co/functions/v1/signal-deal-billing-manager';\nconst SUPABASE_KEY="
new_const="const PORTAL_URL='https://eazukvtjxeirbitukueb.supabase.co/functions/v1/signal-deal-billing-manager';\nconst DELETE_URL='https://eazukvtjxeirbitukueb.supabase.co/functions/v1/signal-deal-delete-account';\nconst SUPABASE_KEY="
if old_const in t and 'const DELETE_URL=' not in t:
    t=t.replace(old_const,new_const)

marker="async function run(name,viewport){"
helper="""async function checkDeletionAndCompliance(){
  const response=await fetch(DELETE_URL,{
    method:'POST',
    headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({confirm:'DELETE_SIGNAL_DEAL_ACCOUNT'})
  });
  assert.equal(response.status,401,'suppression compte: une requête sans session doit être refusée');

  const privacy=await fetch(new URL('privacy.html',BASE));
  assert(privacy.ok,'politique de confidentialité inaccessible');
  const privacyText=await privacy.text();
  assert.match(privacyText,/Politique de confidentialité — Signal Deal/i);
  assert.match(privacyText,/Supprimer mon compte Signal Deal/i);

  const deletion=await fetch(new URL('delete-account.html',BASE));
  assert(deletion.ok,'page suppression de compte inaccessible');
  const deletionText=await deletion.text();
  assert.match(deletionText,/signal-deal-delete-account/);
  assert.match(deletionText,/Supprimer mon compte Signal Deal/i);
}

async function run(name,viewport){"""
if marker in t and 'async function checkDeletionAndCompliance' not in t:
    t=t.replace(marker,helper)

assert_marker="  assert.equal(diagnostics.stripeSecretExposed,false,name+': clé Stripe secrète exposée dans le navigateur');"
assert_new=assert_marker+"\n  assert.equal(await page.evaluate(()=>/account_deletion_requests/.test(enterApp.toString())&&/completed/.test(enterApp.toString())),true,name+': verrou de compte supprimé absent');"
if assert_marker in t and 'verrou de compte supprimé absent' not in t:
    t=t.replace(assert_marker,assert_new)

call_marker="await checkBillingPortalSecurity();\nconst desktop="
call_new="await checkBillingPortalSecurity();\nawait checkDeletionAndCompliance();\nconst desktop="
if call_marker in t and 'await checkDeletionAndCompliance();' not in t:
    t=t.replace(call_marker,call_new)

test.write_text(t,encoding='utf-8')
