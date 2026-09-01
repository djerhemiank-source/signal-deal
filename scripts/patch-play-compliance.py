from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
old_footer = '<footer>Signal Deal · Bêta technique · Les scores et estimations sont des indicateurs commerciaux.</footer>'
new_footer = '<footer>Signal Deal · Bêta technique · Les scores et estimations sont des indicateurs commerciaux. · <a href="./privacy.html">Confidentialité</a> · <a href="./delete-account.html">Supprimer mon compte</a></footer>'
if old_footer not in s and new_footer not in s:
    raise SystemExit('footer marker not found')
s = s.replace(old_footer, new_footer)
old_controls = '<button id="manageSubscriptionBtn" class="btn" onclick="manageSubscription()" style="display:none">Gérer / résilier</button></div><div id="billingMsg" class="msg"></div>'
new_controls = '<button id="manageSubscriptionBtn" class="btn" onclick="manageSubscription()" style="display:none">Gérer / résilier</button><a id="deleteAccountBtn" class="btn danger" href="./delete-account.html">Supprimer mon compte</a></div><div id="billingMsg" class="msg"></div>'
if old_controls not in s and new_controls not in s:
    raise SystemExit('account controls marker not found')
s = s.replace(old_controls, new_controls)
p.write_text(s, encoding='utf-8')

# Add persistent smoke assertions for Play compliance pages/links.
t = Path('tests/root-browser-smoke.mjs')
ts = t.read_text(encoding='utf-8')
marker = "if (html.match(/sk_(live|test)_/i)) throw new Error('Stripe secret key exposed in HTML');"
addition = """if (html.match(/sk_(live|test)_/i)) throw new Error('Stripe secret key exposed in HTML');
  if (!html.includes('./privacy.html')) throw new Error('Privacy policy link missing');
  if (!html.includes('./delete-account.html')) throw new Error('Account deletion link missing');"""
if marker in ts and 'Privacy policy link missing' not in ts:
    ts = ts.replace(marker, addition)

t.write_text(ts, encoding='utf-8')
