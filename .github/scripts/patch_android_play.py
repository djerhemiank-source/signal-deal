from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
index_path = root / "index.html"
test_path = root / "tests/root-browser-smoke.mjs"

s = index_path.read_text(encoding="utf-8")

css = '''
body[data-platform="android-play"] .purchase-cta,
body[data-platform="android-play"] #manageSubscriptionBtn,
body[data-platform="android-play"] #changePlanBtn { display:none!important; }
.play-store-notice { display:none; margin:10px 0 16px; padding:12px 14px; border:1px solid #31567b; background:#0e1930; border-radius:12px; color:#c8d5eb; font-size:11px; line-height:1.5; }
body[data-platform="android-play"] .play-store-notice { display:block; }
'''
assert s.count('</style>') == 1
s = s.replace('</style>', css + '</style>')

old = '<p class="intro">Vous testez gratuitement, puis Stripe débloque automatiquement les fonctions payantes après validation du paiement.</p>'
new = '<p id="pricingIntro" class="intro">Vous testez gratuitement, puis Stripe débloque automatiquement les fonctions payantes après validation du paiement.</p><div id="playStoreNotice" class="play-store-notice">Version Google Play : les achats ne sont pas proposés dans cette application. Les abonnements déjà actifs restent utilisables après connexion.</div>'
assert s.count(old) == 1
s = s.replace(old, new)

replacements = [
    ('<button class="btn cta" onclick="startCheckout(\'essential\')">Choisir Essentiel</button>', '<button class="btn cta purchase-cta" onclick="startCheckout(\'essential\')">Choisir Essentiel</button>'),
    ('<button class="btn primary cta" onclick="startCheckout(\'pro\')">Choisir Pro</button>', '<button class="btn primary cta purchase-cta" onclick="startCheckout(\'pro\')">Choisir Pro</button>'),
    ('<button class="btn cta" onclick="startCheckout(\'agency\')">Choisir Agence</button>', '<button class="btn cta purchase-cta" onclick="startCheckout(\'agency\')">Choisir Agence</button>'),
    ('<a class="btn good" href="#pricing">Changer de formule</a>', '<a id="changePlanBtn" class="btn good" href="#pricing">Changer de formule</a>'),
]
for old, new in replacements:
    assert s.count(old) == 1, old
    s = s.replace(old, new)

marker = "function startCheckout(plan){if(!session)"
assert s.count(marker) == 1
s = s.replace(marker, "const IS_ANDROID_PLAY=new URLSearchParams(location.search).get('platform')==='android-play'||navigator.userAgent.includes('SignalDealAndroidPlay');\nfunction applyPlatformMode(){if(!IS_ANDROID_PLAY)return;document.body.dataset.platform='android-play';const intro=document.getElementById('pricingIntro');if(intro)intro.textContent='Connectez-vous pour utiliser votre formule Signal Deal. Les achats ne sont pas proposés dans la version Google Play.';const manage=document.getElementById('manageSubscriptionBtn');if(manage)manage.style.display='none';const change=document.getElementById('changePlanBtn');if(change)change.style.display='none'}\nfunction startCheckout(plan){if(IS_ANDROID_PLAY){alert('Les achats ne sont pas proposés dans la version Google Play de Signal Deal. Aucun paiement n’a été lancé.');return}if(!session)")

marker = "async function manageSubscription(){if(!session)"
assert s.count(marker) == 1
s = s.replace(marker, "async function manageSubscription(){if(IS_ANDROID_PLAY){const msg=document.getElementById('billingMsg');if(msg)msg.textContent='La gestion Stripe se fait hors de la version Google Play.';return}if(!session)")

pattern = r"function exportCsv\(\)\{.*?\}\nclient\.auth\.onAuthStateChange"
replacement = "function exportCsv(){if(!['pro','agency'].includes(currentPlan)){scrollToPricing();return}const cols=['company','title','sector','region','department','score','probable_need','source_url','published_at','deadline'],csv=[cols.join(';'),...feed.map(o=>cols.map(c=>'\\\"'+String(o[c]??'').replace(/\\\"/g,'\\\"\\\"')+'\\\"').join(';'))].join('\\\\n');if(IS_ANDROID_PLAY&&window.SignalDealAndroid&&typeof window.SignalDealAndroid.saveCsv==='function'){window.SignalDealAndroid.saveCsv('signal-deal-opportunites.csv',csv);return}const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='signal-deal-opportunites.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}\napplyPlatformMode();\nclient.auth.onAuthStateChange"
s, count = re.subn(pattern, replacement, s, count=1, flags=re.S)
assert count == 1, "exportCsv/client.auth target not found"
index_path.write_text(s, encoding="utf-8")

x = test_path.read_text(encoding="utf-8")
marker = "  assert.equal(errors.length,0,name+': erreurs après stress '+errors.join(' | '));\n  await browser.close();\n"
insert = "  assert.equal(errors.length,0,name+': erreurs après stress '+errors.join(' | '));\n\n  const playPage=await context.newPage();\n  await playPage.goto(new URL('?platform=android-play',BASE).href,{waitUntil:'networkidle',timeout:20000});\n  assert.equal(await playPage.evaluate(()=>IS_ANDROID_PLAY),true,name+': mode Android Play non détecté');\n  assert.equal(await playPage.locator('.purchase-cta:visible').count(),0,name+': CTA Stripe visible dans la version Play');\n  assert.equal(await playPage.locator('#manageSubscriptionBtn').isVisible(),false,name+': gestion Stripe visible dans la version Play');\n  assert.equal(await playPage.locator('#changePlanBtn').isVisible(),false,name+': changement de formule visible dans la version Play');\n  assert.match(await playPage.locator('#playStoreNotice').innerText(),/achats ne sont pas proposés/i);\n  await playPage.close();\n\n  await browser.close();\n"
assert x.count(marker) == 1
x = x.replace(marker, insert)
test_path.write_text(x, encoding="utf-8")
